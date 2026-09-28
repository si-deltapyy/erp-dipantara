import { expect, test } from 'vitest'
import { encodeCsv, productionCsv } from './report-csv'
test.each(['=1+1', '+SUM(A1)', '-1+1', '@cmd', '\tformula', '\nformula', '  =1+1'])(
    'neutralizes spreadsheet text %s',
    (value) => {
        expect(encodeCsv([[value]])).toBe('\ufeff"\'' + value + '"\r\n')
    },
)
test('quotes multiline text while preserving typed numbers and empty headers', () => {
    expect(encodeCsv([['a,"b"\nc', 2, { decimal: '0.100000' }, null]])).toBe(
        '\ufeff"a,""b""\nc",2,0.100000,\r\n',
    )
    expect(productionCsv([]).trim().split('\r\n')).toHaveLength(1)
    expect(productionCsv([])).toContain('volumeM3')
})
