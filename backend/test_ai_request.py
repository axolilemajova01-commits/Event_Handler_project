import urllib.request, json, sys
url='http://127.0.0.1:8081/api/events/ai-draft'
body=json.dumps({"prompt":"Create a short workshop for CS students about Spring Boot and React."}).encode('utf-8')
req=urllib.request.Request(url,data=body,headers={"Content-Type":"application/json"},method='POST')
try:
    with urllib.request.urlopen(req,timeout=30) as resp:
        data=resp.read().decode('utf-8','replace')
        print('STATUS', getattr(resp, 'status', 'unknown'))
        print(data)
except Exception as e:
    print('ERROR', e)
    sys.exit(1)
