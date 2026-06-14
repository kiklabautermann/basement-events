import urllib.request

req = urllib.request.Request('http://localhost:8080/assets/BASEMENT2025_12_bluewhite.svg', headers={'Cache-Control': 'no-cache'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e)
