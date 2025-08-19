(function(){
	const GLOBAL_KEY = '__updateCheckInit';
	if (window[GLOBAL_KEY]) return; // prevent double init
	window[GLOBAL_KEY] = true;

	function log(){ try { console.log('[update-check]', ...arguments); } catch(_) {} }

	function compareVersions(a, b) {
		function parse(v){ return String(v||'0').split('.').map(n=>parseInt(n||'0',10)); }
		const A = parse(a), B = parse(b);
		for (let i = 0; i < Math.max(A.length, B.length); i++) {
			const x = A[i] || 0, y = B[i] || 0;
			if (x > y) return 1;
			if (x < y) return -1;
		}
		return 0;
	}

	async function fetchJsonCandidates(urls){
		for (const url of urls) {
			try { const res = await fetch(url, { cache: 'no-store' }); if (res.ok) return await res.json(); } catch(_) {}
		}
		return null;
	}

	function ensureStyles(){
		if (document.getElementById('update-check-styles')) return;
		const style = document.createElement('style');
		style.id = 'update-check-styles';
		style.textContent = `
			#updateNotice {
				position: fixed; top: 10px; right: 10px; z-index: 2147483647;
				background: #fff8e1; color: #5c4400; border: 1px solid #ffe08a; border-radius: 6px;
				padding: 8px 10px; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
			}
			#updateNotice a { color: #3b82f6; text-decoration: underline; }
		`;
		document.head.appendChild(style);
	}

	function showInlineNotice(textHtml){
		try {
			if (typeof window.addNotification === 'function') {
				window.addNotification(textHtml);
				return;
			}
		} catch(_) {}
		ensureStyles();
		let box = document.getElementById('updateNotice');
		if (!box) {
			box = document.createElement('div');
			box.id = 'updateNotice';
			document.body.appendChild(box);
		}
		box.innerHTML = textHtml;
	}

	async function initUpdateCheck(platform){
		try {
			const latest = await fetchJsonCandidates([
				'http://localhost:3001/api/latest',
				'latest.json',
				'/latest.json'
			]);
			if (!latest || !latest.version) { log('no-latest'); return; }
			let current = '0.0.0';
			try {
				const r = await fetch('http://localhost:3001/api/version', { cache: 'no-store' });
				if (r.ok) { const j = await r.json(); if (j && j.version) current = String(j.version); }
			} catch(_) {}
			if (compareVersions(latest.version, current) > 0) {
				const url = latest.downloadUrl || '#';
				const notes = latest.notes ? ` – ${latest.notes}` : '';
				showInlineNotice(`Update available: <strong>${latest.version}</strong>${notes}. <a href="${url}" target="_blank" rel="noopener">Download</a>`);
				log('update-available', { latest: latest.version, current });
			} else {
				log('up-to-date', { latest: latest.version, current });
			}
		} catch (e) {
			log('error', e && (e.message || e));
		}
	}

	window.initUpdateCheck = initUpdateCheck;
})();


