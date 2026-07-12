package za.ac.tut.eventhandler.service;

import org.springframework.stereotype.Service;
import za.ac.tut.eventhandler.model.Event;

import java.util.HashMap;
import java.util.Map;

@Service
public class PosterTemplateService {

    private static final Map<String, String> GRADIENTS = new HashMap<>();
    static {
        GRADIENTS.put("WORKSHOP", "linear-gradient(135deg, #005daa, #1d8a64)");
        GRADIENTS.put("SEMINAR", "linear-gradient(135deg, #15161a, #005daa)");
        GRADIENTS.put("CONFERENCE", "linear-gradient(135deg, #1d8a64, #15161a)");
        GRADIENTS.put("CAREER_FAIR", "linear-gradient(135deg, #d95f43, #f2b705)");
        GRADIENTS.put("SPORTS", "linear-gradient(135deg, #1d8a64, #f2b705)");
        GRADIENTS.put("CULTURAL", "linear-gradient(135deg, #d95f43, #005daa)");
        GRADIENTS.put("ACADEMIC", "linear-gradient(135deg, #15161a, #f2b705)");
        GRADIENTS.put("HACKATHON", "linear-gradient(135deg, #005daa, #d95f43)");
        GRADIENTS.put("ENTERTAINMENT", "linear-gradient(135deg, #d95f43, #f2b705)");
        GRADIENTS.put("ORIENTATION", "linear-gradient(135deg, #1d8a64, #005daa)");
        GRADIENTS.put("STUDENT_SOCIETY", "linear-gradient(135deg, #f2b705, #d95f43)");
        GRADIENTS.put("COMMUNITY_OUTREACH", "linear-gradient(135deg, #005daa, #1d8a64)");
    }

    public String generatePosterHtml(Event event) {
        String gradient = GRADIENTS.getOrDefault(event.getCategory().name(), "linear-gradient(135deg, #005daa, #d95f43)");
        String dateStr = event.getEventDate() != null ? event.getEventDate().toString() : "TBC";
        String timeStr = event.getStartTime() != null ? event.getStartTime().toString().substring(0, 5) : "TBC";
        
        return String.format("""
            <div style="width: 800px; height: 1100px; background: %s; padding: 0; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; justify-content: flex-end; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -60px; right: -60px; width: 300px; height: 300px; border-radius: 50%%; background: rgba(255,255,255,0.03);"></div>
                <div style="position: absolute; bottom: -40px; left: -40px; width: 200px; height: 200px; border-radius: 50%%; background: rgba(0,0,0,0.04);"></div>
                <div style="padding: 60px; padding-top: 200px;">
                    <div style="background: rgba(255,255,255,0.95); border-radius: 24px; padding: 48px; backdrop-filter: blur(10px);">
                        <div style="width: 60px; height: 4px; background: %s; border-radius: 2px; margin-bottom: 24px;"></div>
                        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #6b7280; margin-bottom: 8px;">%%s</div>
                        <h1 style="margin: 0 0 16px; font-size: 42px; font-weight: 800; line-height: 1.1; color: #15161a;">%%s</h1>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">%%s</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px;">
                                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; font-weight: 600;">Date</p>
                                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700; color: #15161a;">%%s</p>
                            </div>
                            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px;">
                                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; font-weight: 600;">Time</p>
                                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700; color: #15161a;">%%s</p>
                            </div>
                            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px;">
                                <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; font-weight: 600;">Venue</p>
                                <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700; color: #15161a;">%%s</p>
                            </div>
                        </div>
                        <div style="margin-top: 32px; text-align: center; font-size: 12px; color: #9ca3af;">
                            TUT Event Handler &bull; Tshwane University of Technology
                        </div>
                    </div>
                </div>
            </div>
            """, gradient, gradient.split(",")[0].replace("linear-gradient(135deg, ", "").trim(),
            event.getCategory().name().replace("_", " "),
            event.getTitle(),
            event.getDescription() != null ? (event.getDescription().length() > 150 ? event.getDescription().substring(0, 150) + "..." : event.getDescription()) : "",
            dateStr, timeStr + ":00", event.getVenue() != null ? event.getVenue() : "TBC");
    }
}