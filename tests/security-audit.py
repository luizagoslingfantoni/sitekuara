"""Read-only checks of the built public artifact; never prints credential values."""
from pathlib import Path
from html.parser import HTMLParser
import re, json, subprocess
root=Path(__file__).resolve().parents[1]/'dist'
errors=[]; forms=[]; pages=0; js=0; files=0
class Check(HTMLParser):
 def handle_starttag(self, tag, attrs):
  a=dict(attrs)
  if any(k.startswith('on') for k in a) or 'style' in a: errors.append(self.file+': inline attribute')
  if tag=='style': errors.append(self.file+': inline CSS')
  if tag=='script' and not a.get('src') and a.get('type')!='application/ld+json': errors.append(self.file+': inline script')
  if tag=='a' and a.get('target')=='_blank' and not {'noopener','noreferrer'}<=set(a.get('rel','').split()): errors.append(self.file+': opener access')
  if tag=='form':
   forms.append(a.get('name'))
   if a.get('method','').lower()!='post' or 'data-turnstile-form' not in a or not a.get('netlify-honeypot'): errors.append(self.file+': missing form protection')
  for key in ['src','href','action']:
   value=a.get(key,'').strip().lower()
   if value.startswith(('javascript:','http:','data:text/html')): errors.append(self.file+': unsafe URL')
checker=Check()
secret=re.compile(r'xkeysib-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{30,}')
for f in root.rglob('*'):
 if not f.is_file():continue
 files+=1
 if f.suffix in ['.js','.html','.css','.json','.xml','.svg','.txt']:
  text=f.read_text(errors='replace')
  if secret.search(text): errors.append(str(f.relative_to(root))+': credential pattern')
  if f.suffix=='.html':
   pages+=1;checker.file=str(f.relative_to(root));checker.feed(text)
   if 'Content-Security-Policy' not in text:errors.append(checker.file+': no CSP meta')
  if f.suffix=='.js':
   js+=1
   result=subprocess.run(['node','--check',str(f)],capture_output=True)
   if result.returncode:errors.append(str(f.relative_to(root))+': JS syntax')
for private in ['netlify','scripts','tests','netlify.toml','.env','CONFIGURAR-BREVO.md']:
 if (root/private).exists():errors.append('Private artifact published: '+private)
headers=(root/'_headers').read_text()
for required in ["script-src-attr 'none'", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'self'",'X-Content-Type-Options: nosniff','Strict-Transport-Security:']:
 if required not in headers:errors.append('Missing security header: '+required)
print(json.dumps({'files':files,'html_pages':pages,'browser_scripts':js,'netlify_forms':len(forms),'errors':errors},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
