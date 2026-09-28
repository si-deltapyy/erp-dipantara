export function createDemoPdf(lines: readonly string[]): Blob {
    const wrapped = lines.flatMap((line) => line.match(/.{1,85}/g) ?? [''])
    const pages = Array.from({ length: Math.ceil(wrapped.length / 40) }, (_, index) =>
        wrapped.slice(index * 40, (index + 1) * 40),
    )
    const objects: string[] = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    for (const page of pages) {
        const contentId = objects.length + 2
        objects.push(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
        )
        const text = page
            .map(
                (line) =>
                    '(' +
                    line.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1') +
                    ') Tj T*',
            )
            .join('\n')
        const stream = `BT /F1 10 Tf 40 800 Td 18 TL\n${text}\nET`
        objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    }
    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((object, index) => {
        offsets.push(pdf.length)
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    })
    const start = pdf.length
    pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`
    pdf += offsets
        .slice(1)
        .map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n')
        .join('')
    pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`
    return new Blob([pdf], { type: 'application/pdf' })
}
