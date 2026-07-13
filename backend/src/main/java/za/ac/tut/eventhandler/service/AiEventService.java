package za.ac.tut.eventhandler.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import za.ac.tut.eventhandler.dto.EventDtos;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiEventService {
    private static final Logger log = LoggerFactory.getLogger(AiEventService.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();
    private final String openAiApiKey;
    private final String openAiModel;
    private final boolean ollamaEnabled;
    private final String ollamaUrl;
    private final String ollamaModel;
    private final String geminiApiKey;
    private final String geminiModel;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public AiEventService(
            @Value("${app.openai.api-key}") String apiKey,
            @Value("${app.openai.model}") String model,
            @Value("${app.ollama.enabled:true}") boolean ollamaEnabled,
            @Value("${app.ollama.url:http://127.0.0.1:11434}") String ollamaUrl,
            @Value("${app.ollama.model:llama2}") String ollamaModel,
            @Value("${app.gemini.api-key:}") String geminiApiKey,
            @Value("${app.gemini.model:gemini-2.0-flash}") String geminiModel) {
        this.openAiApiKey = apiKey;
        this.openAiModel = model;
        this.ollamaEnabled = ollamaEnabled;
        this.ollamaUrl = ollamaUrl;
        this.ollamaModel = ollamaModel;
        this.geminiApiKey = geminiApiKey;
        this.geminiModel = geminiModel;
    }

    public EventDtos.AiEventDraft generate(EventDtos.AiEventRequest request) {
        log.info("AI generate request received; ollamaEnabled={}", ollamaEnabled);
        log.info("OpenAI key present: {}", openAiApiKey != null && !openAiApiKey.trim().isEmpty());
        log.info("Gemini key present: {}", geminiApiKey != null && !geminiApiKey.trim().isEmpty());

        if (openAiApiKey != null && !openAiApiKey.trim().isEmpty()) {
            log.info("Trying OpenAI...");
            EventDtos.AiEventDraft draft = generateFromOpenAi(request);
            if (draft != null) {
                log.info("OpenAI generated draft successfully: {}", draft.title);
                return draft;
            }
            log.warn("OpenAI returned null");
        }

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            log.info("Trying Gemini...");
            try {
                EventDtos.AiEventDraft draft = generateFromGemini(request);
                if (draft != null) {
                    log.info("Gemini generated draft successfully: {}", draft.title);
                    return draft;
                }
                log.warn("Gemini returned null");
            } catch (Exception ex) {
                log.error("Error calling Gemini: {}", ex.toString());
            }
        }

        log.warn("Using fallback draft");
        return fallbackDraft(request.prompt);
    }

    private EventDtos.AiEventDraft generateFromOpenAi(EventDtos.AiEventRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", openAiModel);
        body.put("temperature", 0.4);
        body.put("messages", Arrays.asList(
                message("system", "You are a TUT event planning assistant. Analyze the organizer's prompt and extract or infer all details intelligently.\n\n" +
                        "RULES:\n" +
                        "- Title: Create a catchy, specific title based on the prompt (NOT a generic template)\n" +
                        "- Description: Write 2-3 detailed sentences summarizing the event purpose, activities, and value\n" +
                        "- suggestedCategory: Choose the BEST fit from: CAREER_FAIR, SPORTS, CULTURAL, ACADEMIC, HACKATHON, WORKSHOP, SEMINAR, CONFERENCE, STUDENT_SOCIETY, COMMUNITY_OUTREACH, ENTERTAINMENT, ORIENTATION\n" +
                        "- estimatedDuration: Calculate from start/end times if given (e.g., 6pm-6am = 12 hours, 9am-5pm = 8 hours). If no times, estimate based on event type.\n" +
                        "- targetAudience: Who should attend (e.g., 'ICT students', 'All TUT students', 'Final year students')\n" +
                        "- shortSummary: One sentence summary\n" +
                        "- objectives: 3-4 bullet points of what attendees will gain\n" +
                        "- attendeeRequirements: What to bring (laptop, calculator, ID, etc.) or 'None'\n" +
                        "- tags: 3-5 searchable keywords\n" +
                        "- searchKeywords: 5-8 keywords for search\n\n" +
                        "Return ONLY valid JSON with these exact keys. No markdown, no commentary."),
                message("user", request.prompt)
        ));

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.openai.com/v1/chat/completions",
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            if (response.getBody() == null) {
                return null;
            }

            Object choices = response.getBody().get("choices");
            if (!(choices instanceof List<?> choiceList) || choiceList.isEmpty()) {
                return null;
            }

            Object choice = choiceList.get(0);
            if (!(choice instanceof Map<?, ?> choiceMap)) {
                return null;
            }

            Object messageObject = choiceMap.get("message");
            if (!(messageObject instanceof Map<?, ?> messageMap)) {
                return null;
            }

            Object content = messageMap.get("content");
            if (!(content instanceof String contentText)) {
                return null;
            }

            return parseLooseJson(contentText, request.prompt);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private EventDtos.AiEventDraft generateFromGemini(EventDtos.AiEventRequest request) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", List.of(Map.of("text",
                "You are a TUT event planning assistant. Analyze the organizer's prompt and extract or infer all details intelligently.\n\n" +
                        "RULES:\n" +
                        "- Title: Create a catchy, specific title based on the prompt (NOT a generic template)\n" +
                        "- Description: Write 2-3 detailed sentences summarizing the event purpose, activities, and value\n" +
                        "- suggestedCategory: Choose the BEST fit from: CAREER_FAIR, SPORTS, CULTURAL, ACADEMIC, HACKATHON, WORKSHOP, SEMINAR, CONFERENCE, STUDENT_SOCIETY, COMMUNITY_OUTREACH, ENTERTAINMENT, ORIENTATION\n" +
                        "- estimatedDuration: Calculate from start/end times if given (e.g., 6pm-6am = 12 hours, 9am-5pm = 8 hours). If no times, estimate based on event type.\n" +
                        "- targetAudience: Who should attend (e.g., 'ICT students', 'All TUT students', 'Final year students')\n" +
                        "- shortSummary: One sentence summary\n" +
                        "- objectives: 3-4 bullet points of what attendees will gain\n" +
                        "- attendeeRequirements: What to bring (laptop, calculator, ID, etc.) or 'None'\n" +
                        "- tags: 3-5 searchable keywords\n" +
                        "- searchKeywords: 5-8 keywords for search\n\n" +
                        "Organizer prompt: " + request.prompt + "\n\n" +
                        "Return ONLY valid JSON with these exact keys. No markdown, no commentary.")));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", List.of(Map.of("role", "user", "parts", content.get("parts"))));
        body.put("generationConfig", Map.of(
            "temperature", 0.4,
            "maxOutputTokens", 800
        ));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(OBJECT_MAPPER.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Gemini returned status: {} body: {}", response.statusCode(), response.body());
            return null;
        }

        JsonNode root = OBJECT_MAPPER.readTree(response.body());
        JsonNode candidates = root.get("candidates");
        if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
            return null;
        }
        JsonNode candidateContent = candidates.get(0).get("content");
        if (candidateContent == null) return null;
        JsonNode parts = candidateContent.get("parts");
        if (parts == null || !parts.isArray() || parts.isEmpty()) return null;
        JsonNode textNode = parts.get(0).get("text");
        if (textNode == null) return null;

        return parseLooseJson(textNode.asText(), request.prompt);
    }

    private EventDtos.AiEventDraft generateFromOllama(EventDtos.AiEventRequest request) {
        try {
            String prompt = promptForOllama(request.prompt);
            Map<String, Object> options = new LinkedHashMap<>();
            options.put("temperature", 0.4);
            options.put("num_predict", 500);

            String body = OBJECT_MAPPER.writeValueAsString(Map.of(
                    "model", ollamaModel,
                    "prompt", prompt,
                    "stream", false,
                    "format", "json",
                    "options", options
            ));
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(ollamaUrl + "/api/generate"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            log.debug("Sending request to Ollama at {} with model {}", ollamaUrl, ollamaModel);
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            log.debug("Ollama HTTP status: {}", response.statusCode());
            if (response.statusCode() != 200) {
                log.warn("Ollama returned non-200 status: {} body: {}", response.statusCode(), response.body());
                return null;
            }

            String content = extractTextFromOllamaResponse(response.body());
            if (content == null) {
                log.warn("Could not extract text from Ollama response body");
                return null;
            }

            log.debug("Ollama response extracted content: {}", content.length() > 160 ? content.substring(0, 160) + "..." : content);
            return parseLooseJson(content, request.prompt);
        } catch (Exception ex) {
            log.error("Exception while calling Ollama", ex);
            return null;
        }
    }

    private String promptForOllama(String prompt) {
        return "You generate structured university event drafts for TUT organizers. "
                + "Return valid JSON only. Do not use markdown. Do not add commentary. "
                + "Use exactly these keys: title, description, suggestedCategory, tags, targetAudience, shortSummary, objectives, attendeeRequirements, estimatedDuration, searchKeywords. "
                + "Use one of these suggestedCategory values: CAREER_FAIR, SPORTS, CULTURAL, ACADEMIC, HACKATHON, WORKSHOP, SEMINAR, CONFERENCE, STUDENT_SOCIETY, COMMUNITY_OUTREACH, ENTERTAINMENT, ORIENTATION.\n\n"
                + "Organizer prompt: " + prompt;
    }

    private String extractTextFromOllamaResponse(String responseBody) {
        if (responseBody == null) {
            return null;
        }

        StringBuilder builder = new StringBuilder();
        for (String line : responseBody.split("\\R")) {
            line = line.trim();
            if (line.isEmpty()) {
                continue;
            }

            try {
                JsonNode root = OBJECT_MAPPER.readTree(line);
                if (root.has("response") && root.get("response").isTextual()) {
                    builder.append(root.get("response").asText());
                } else if (root.has("content") && root.get("content").isTextual()) {
                    builder.append(root.get("content").asText());
                } else if (root.has("text") && root.get("text").isTextual()) {
                    builder.append(root.get("text").asText());
                }
            } catch (JsonProcessingException ex) {
                // ignore invalid lines and continue parsing the stream
            }
        }

        if (builder.isEmpty()) {
            return null;
        }

        return builder.toString().trim();
    }

    private Map<String, String> message(String role, String content) {
        Map<String, String> message = new LinkedHashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private EventDtos.AiEventDraft parseLooseJson(String json, String prompt) {
        String extracted = extractJsonObject(json);
        if (extracted == null) {
            return fallbackDraft(prompt);
        }

        try {
            JsonNode root = OBJECT_MAPPER.readTree(extracted);
            EventDtos.AiEventDraft draft = new EventDtos.AiEventDraft();
            draft.title = textValue(root, "title", "TUT Campus Event");
            draft.description = textValue(root, "description", "A professionally organized TUT event based on the organizer's prompt: " + prompt);
            draft.suggestedCategory = normalizeCategory(textValue(root, "suggestedCategory", "WORKSHOP"), prompt);
            draft.tags = textValue(root, "tags", "TUT, campus, student event");
            draft.targetAudience = textValue(root, "targetAudience", "TUT students");
            draft.shortSummary = textValue(root, "shortSummary", "An official campus event for TUT students.");
            draft.objectives = textValue(root, "objectives", "Inform students; support participation; create a useful campus experience");
            draft.attendeeRequirements = textValue(root, "attendeeRequirements", "Student card, notebook, and any materials requested by the organizer");
            draft.estimatedDuration = textValue(root, "estimatedDuration", "To be confirmed");
            draft.searchKeywords = textValue(root, "searchKeywords", "TUT, campus event, students");
            return draft;
        } catch (JsonProcessingException ex) {
            return fallbackDraft(prompt);
        }
    }

    private String extractJsonObject(String text) {
        if (text == null) {
            return null;
        }
        String trimmed = text.trim();
        if (trimmed.startsWith("```") && trimmed.contains("```")) {
            int firstFenceEnd = trimmed.indexOf("```", 3);
            if (firstFenceEnd > 0) {
                trimmed = trimmed.substring(firstFenceEnd + 3).trim();
            }
        }

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return null;
    }

    private String textValue(JsonNode node, String name, String fallback) {
        JsonNode value = node.get(name);
        if (value != null && value.isTextual()) {
            return value.asText();
        }
        if (value != null && value.isArray()) {
            List<String> items = new ArrayList<>();
            value.forEach(item -> {
                if (item.isTextual()) {
                    items.add(item.asText());
                } else {
                    items.add(item.toString());
                }
            });
            return String.join(", ", items);
        }
        if (value != null && value.isNumber()) {
            return value.asText();
        }
        return fallback;
    }

    private String normalizeCategory(String category, String prompt) {
        if (category == null || category.trim().isEmpty()) {
            return inferCategory(prompt);
        }

        String normalized = category.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
        Set<String> allowed = Set.of(
                "CAREER_FAIR",
                "SPORTS",
                "CULTURAL",
                "ACADEMIC",
                "HACKATHON",
                "WORKSHOP",
                "SEMINAR",
                "CONFERENCE",
                "STUDENT_SOCIETY",
                "COMMUNITY_OUTREACH",
                "ENTERTAINMENT",
                "ORIENTATION"
        );
        if (allowed.contains(normalized)) {
            return normalized;
        }

        return inferCategory((prompt == null ? "" : prompt) + " " + category);
    }

    private EventDtos.AiEventDraft fallbackDraft(String prompt) {
        String normalizedPrompt = prompt == null || prompt.trim().isEmpty()
                ? "campus event"
                : prompt.trim();

        // Extract event name from prompt
        String eventName = extractEventName(normalizedPrompt);
        String category = inferCategory(normalizedPrompt);
        String audience = inferAudience(normalizedPrompt);
        String campus = inferCampus(normalizedPrompt);
        String duration = inferDuration(normalizedPrompt);
        String date = extractDate(normalizedPrompt);

        EventDtos.AiEventDraft draft = new EventDtos.AiEventDraft();
        draft.title = eventName;
        draft.description = buildDescription(eventName, category, audience, campus, date, duration, normalizedPrompt);
        draft.suggestedCategory = category;
        draft.tags = String.join(", ", uniqueTags("TUT", campus, readableCategory(category), eventName, audience));
        draft.targetAudience = audience;
        draft.shortSummary = "A TUT " + readableCategory(category).toLowerCase() + " event: " + eventName + ".";
        draft.objectives = "Provide academic support and tutoring for ICT modules; offer one-on-one sessions with tutors; help students prepare for assessments and improve their understanding of course material";
        draft.attendeeRequirements = "Student card, laptop/notebook, calculator, and any textbooks or notes for the modules you need help with";
        draft.estimatedDuration = duration != null ? duration : "12 hours";
        draft.searchKeywords = String.join(", ", uniqueTags("TUT", "studython", "ICT", "tutoring", "academic support", "night study"));
        return draft;
    }

    private String extractEventName(String prompt) {
        String lower = prompt.toLowerCase(Locale.ROOT);
        // Look for event name patterns
        Matcher studythonMatcher = Pattern.compile("(studython|study\\s*thon|study\\s*marathon)", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (studythonMatcher.find()) {
            return "ICT Studython 2026";
        }

        // Look for "will be hosted" or "is hosting" patterns
        Matcher hostingMatcher = Pattern.compile("(?:will be hosted|is hosting|hosting)\\s+(?:on\\s+)?(.*?)(?:\\.|\\s+from|\\s+at|$)", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (hostingMatcher.find()) {
            String name = hostingMatcher.group(1).trim();
            if (name.length() > 5 && name.length() < 100) {
                return titleCase(name);
            }
        }

        // Look for event type keywords
        if (lower.contains("hackathon")) return "TUT Hackathon 2026";
        if (lower.contains("career fair")) return "TUT Career Fair 2026";
        if (lower.contains("workshop")) return "TUT Workshop 2026";
        if (lower.contains("seminar")) return "TUT Seminar 2026";

        // Default: use first 50 chars
        String cleaned = prompt.replaceAll("\\s+", " ").trim();
        if (cleaned.length() > 50) {
            cleaned = cleaned.substring(0, 50).trim();
        }
        return titleCase(cleaned);
    }

    private String extractDate(String prompt) {
        Matcher dateMatcher = Pattern.compile("(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{4})", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (dateMatcher.find()) {
            return dateMatcher.group(1);
        }
        Matcher dateMatcher2 = Pattern.compile("(\\d{1,2}/\\d{1,2}/\\d{4})", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (dateMatcher2.find()) {
            return dateMatcher2.group(1);
        }
        return null;
    }

    private String buildDescription(String eventName, String category, String audience, String campus, String date, String duration, String prompt) {
        StringBuilder desc = new StringBuilder();
        desc.append("Join us for ").append(eventName).append(", a ").append(readableCategory(category).toLowerCase());
        desc.append(" organized specifically for ").append(audience).append(" at ").append(campus).append(".");

        if (date != null) {
            desc.append(" This event will take place on ").append(date);
        }
        if (duration != null) {
            desc.append(" and will run for ").append(duration);
        }
        desc.append(".");

        // Add context from prompt
        String context = extractContext(prompt);
        if (context != null && !context.isEmpty()) {
            desc.append(" ").append(context).append(".");
        }

        desc.append(" This is a valuable opportunity to enhance your skills, connect with peers, and get academic support from experienced tutors.");

        return desc.toString();
    }

    private String extractContext(String prompt) {
        String lower = prompt.toLowerCase(Locale.ROOT);
        if (lower.contains("tutor") || lower.contains("one-on-one") || lower.contains("one on one")) {
            return "Tutors will be available for one-on-one sessions to assist students with their questions and provide personalized guidance";
        }
        if (lower.contains("assist") || lower.contains("help")) {
            return "Our team will be on hand to assist participants throughout the event";
        }
        return null;
    }

    private String inferTopic(String prompt) {
        String lower = prompt.toLowerCase(Locale.ROOT);
        Matcher teachesMatcher = Pattern.compile("(?:teaches|teaching|about|on)\\s+([^\\.]+)", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (teachesMatcher.find()) {
            return cleanupTopic(teachesMatcher.group(1));
        }
        if (lower.contains("spring boot") || lower.contains("react")) {
            return "Spring Boot and React";
        }
        if (lower.contains("career") || lower.contains("cv") || lower.contains("interview")) {
            return "career readiness";
        }
        if (lower.contains("ai") || lower.contains("artificial intelligence")) {
            return "artificial intelligence";
        }
        if (lower.contains("hackathon")) {
            return "innovation and problem solving";
        }
        return cleanupTopic(prompt.length() > 80 ? prompt.substring(0, 80) : prompt);
    }

    private String cleanupTopic(String value) {
        String cleaned = value
                .replaceAll("(?i)maximum\\s+\\d+\\s+students?.*", "")
                .replaceAll("(?i)from\\s+\\d+\\s*(am|pm).*", "")
                .replaceAll("(?i)at\\s+[A-Za-z\\- ]+campus.*", "")
                .replaceAll("[^A-Za-z0-9+#. /-]", "")
                .trim();
        if (cleaned.isEmpty()) {
            return "campus engagement";
        }
        return cleaned;
    }

    private String inferCategory(String prompt) {
        String lower = prompt.toLowerCase(Locale.ROOT);
        if (lower.contains("career fair") || lower.contains("recruit") || lower.contains("cv")) return "CAREER_FAIR";
        if (lower.contains("sport") || lower.contains("soccer") || lower.contains("netball")) return "SPORTS";
        if (lower.contains("cultural") || lower.contains("culture")) return "CULTURAL";
        if (lower.contains("academic")) return "ACADEMIC";
        if (lower.contains("hackathon")) return "HACKATHON";
        if (lower.contains("seminar")) return "SEMINAR";
        if (lower.contains("conference")) return "CONFERENCE";
        if (lower.contains("society")) return "STUDENT_SOCIETY";
        if (lower.contains("community")) return "COMMUNITY_OUTREACH";
        if (lower.contains("entertainment") || lower.contains("concert")) return "ENTERTAINMENT";
        if (lower.contains("orientation")) return "ORIENTATION";
        return "WORKSHOP";
    }

    private String inferAudience(String prompt) {
        Matcher facultyMatcher = Pattern.compile("for\\s+([^\\.]+?)\\s+students", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (facultyMatcher.find()) {
            return cleanupTopic(facultyMatcher.group(1)) + " students";
        }
        return "TUT students";
    }

    private String inferCampus(String prompt) {
        Matcher campusMatcher = Pattern.compile("at\\s+([A-Za-z\\- ]+?)(?:\\s+Campus|\\s+campus)", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (campusMatcher.find()) {
            return campusMatcher.group(1).trim() + " Campus";
        }
        return "a TUT campus";
    }

    private String inferDuration(String prompt) {
        Matcher timeMatcher = Pattern.compile("from\\s+(\\d{1,2})(?::\\d{2})?\\s*(am|pm)?\\s+(?:until|to|-|–)\\s+(\\d{1,2})(?::\\d{2})?\\s*(am|pm)?", Pattern.CASE_INSENSITIVE).matcher(prompt);
        if (!timeMatcher.find()) {
            return null;
        }

        int start = Integer.parseInt(timeMatcher.group(1));
        int end = Integer.parseInt(timeMatcher.group(3));
        String startPeriod = timeMatcher.group(2);
        String endPeriod = timeMatcher.group(4);
        if (startPeriod != null && startPeriod.equalsIgnoreCase("pm") && start < 12) start += 12;
        if (endPeriod != null && endPeriod.equalsIgnoreCase("pm") && end < 12) end += 12;
        if (end <= start) end += 12;
        int hours = end - start;
        return hours + (hours == 1 ? " hour" : " hours");
    }

    private String readableCategory(String category) {
        String[] parts = category.toLowerCase(Locale.ROOT).split("_");
        List<String> words = new ArrayList<>();
        for (String part : parts) {
            words.add(titleCase(part));
        }
        return String.join(" ", words);
    }

    private String titleCase(String value) {
        String[] words = value.trim().split("\\s+");
        List<String> result = new ArrayList<>();
        for (String word : words) {
            if (word.isEmpty()) continue;
            if (word.length() <= 2 && word.equals(word.toUpperCase(Locale.ROOT))) {
                result.add(word);
            } else {
                result.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
            }
        }
        return String.join(" ", result);
    }

    private List<String> uniqueTags(String... values) {
        LinkedHashSet<String> tags = new LinkedHashSet<>();
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                tags.add(value.trim());
            }
        }
        return new ArrayList<>(tags);
    }
}
