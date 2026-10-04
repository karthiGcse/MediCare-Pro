import os

script_content = """
<script>
    document.addEventListener('error', function(e) {
        if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
            e.target.src = 'https://placehold.co/400x300/f8fafc/94a3b8?text=Image+Unavailable';
            e.target.style.objectFit = 'contain';
        }
    }, true);
</script>
"""

def inject(path):
    for root, dirs, files in os.walk(path):
        for f in files:
            if f.endswith('.html'):
                file_path = os.path.join(root, f)
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                if "Image+Unavailable" not in content:
                    content = content.replace('</body>', f'{script_content}</body>')
                    with open(file_path, 'w', encoding='utf-8') as file:
                        file.write(content)
                print(f"Processed {file_path}")

inject(r'c:\Users\karth\Downloads\MediCare_Pro_Google_Cloud_Complete_v2\MediCare Pro\frontend')
