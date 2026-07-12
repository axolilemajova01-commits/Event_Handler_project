import urllib.request, sys
url='http://127.0.0.1:8081/'
try:
    with urllib.request.urlopen(url, timeout=10) as resp:
        print('STATUS', getattr(resp,'status','unknown'))
        print(resp.read().decode('utf-8','replace'))
except Exception as e:
    print('ERROR', e)
    sys.exit(1)
