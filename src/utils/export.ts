export function exportToCSV(filename: string, rows: Array<Record<string, any>>, headers?: Array<{ key: string; label: string }>) {
	const keys = headers ? headers.map(h => h.key) : (rows[0] ? Object.keys(rows[0]) : [])
	const labels = headers ? headers.map(h => h.label) : keys
	const escape = (val: any) => {
		if (val === null || val === undefined) return ''
		const s = String(val).replace(/"/g, '""')
		return /[",\n]/.test(s) ? `"${s}"` : s
	}
	const csv = [labels.join(',')].concat(
		rows.map(row => keys.map(k => escape(row[k])).join(',')),
	).join('\n')
	const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' })
	const link = document.createElement('a')
	const url = URL.createObjectURL(blob)
	link.setAttribute('href', url)
	link.setAttribute('download', filename)
	link.style.visibility = 'hidden'
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}

