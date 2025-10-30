console.log('Script starting...');
const contentDiv = document.getElementById('content');
console.log('Content div:', contentDiv);

const hash = window.location.hash.substring(1);
console.log('Hash length:', hash.length);
console.log('Hash preview:', hash.substring(0, 50));

if (!hash) {
    contentDiv.innerHTML = '<div class="result"><p>❌ No data in URL</p></div>';
} else {
    try {
        const decoded = decodeURIComponent(hash);
        console.log('Decoded:', decoded.substring(0, 100));

        const data = JSON.parse(decoded);
        console.log('Parsed data:', data);

        const a = data.analysis;

        let html = '';
        html += '<div class="result"><h3>📝 Text</h3><p>' + (data.text || 'N/A') + '</p></div>';
        html += '<div class="result"><h3>😊 Sentiment</h3><div class="value">' + a.sentiment + '</div></div>';
        html += '<div class="result"><h3>✨ Clarity</h3><div class="value">' + a.clarity + '</div></div>';
        html += '<div class="result"><h3>⚠️ Risk</h3><div class="value">' + a.reputationRisk + '</div></div>';

        if (a.suggestions && a.suggestions.length > 0) {
            html += '<div class="result"><h3>💡 Suggestions</h3><ul>';
            a.suggestions.forEach(function(s) {
                html += '<li>' + s + '</li>';
            });
            html += '</ul></div>';
        }

        html += '<p style="text-align: center; color: #999; margin-top: 30px;">' + (a.model || a.provider) + '</p>';

        contentDiv.innerHTML = html;
    } catch (e) {
        contentDiv.innerHTML = '<div class="result"><h3>❌ Error</h3><p style="color: red;">' + e.message + '</p><pre style="font-size: 10px; background: #fee; padding: 10px; overflow: auto;">' + e.stack + '</pre></div>';
    }
}
