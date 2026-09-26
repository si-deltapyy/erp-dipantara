export function formatPurchaseOrderMoney(value: string): string {
    const negative = value.startsWith('-')
    const [whole = '0', fraction = '00'] = (negative ? value.slice(1) : value).split('.')
    return `${negative ? '-' : ''}Rp ${BigInt(whole).toLocaleString('id-ID')},${fraction}`
}
