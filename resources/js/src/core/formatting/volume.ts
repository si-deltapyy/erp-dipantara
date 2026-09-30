export function formatVolume(value: string): string {
    const [whole = '0', fraction = '000000'] = value.split('.')
    return `${BigInt(whole).toLocaleString('id-ID')},${fraction}`
}
