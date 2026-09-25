import { expect, test } from 'vitest'
import { simulateTimberVolume } from './timber-volume'
import { timberDiameterCategory } from '@/core/domain/timber-measurements'

test.each([
    ['19.9', 'A1'],
    ['20', 'A2'],
    ['29.9', 'A2'],
    ['30', 'A3'],
])('classifies diameter %s as %s', (diameter, category) => {
    expect(timberDiameterCategory(diameter)).toBe(category)
})
test('rounds simulated cylinder volume half-up to six places per log', () => {
    expect(simulateTimberVolume('20', '2')).toBe('0.062832')
    expect(simulateTimberVolume('30', '2')).toBe('0.141372')
    expect(simulateTimberVolume('1', '1')).toBe('0.000079')
    expect(simulateTimberVolume('0.01', '0.01')).toBe('0.000000')
    expect(simulateTimberVolume('200', '2')).toBe('6.283185')
    expect(simulateTimberVolume('1000', '20000000')).toBe('1570796326.794897')
    expect(simulateTimberVolume('2000000000000', '2')).toBe('628318530717958600000.000000')
})
test.each(['', '0', '-20', '20.001', '20,1', '2e1'])(
    'does not preview invalid dimensions %s',
    (diameter) => {
        expect(simulateTimberVolume(diameter, '2')).toBeNull()
        expect(timberDiameterCategory(diameter)).toBeNull()
    },
)
