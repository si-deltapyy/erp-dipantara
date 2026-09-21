import { AxiosError, CanceledError } from 'axios'
import { it, expect } from 'vitest'
import { createHttpClient } from './http-client'

it.each([
    [401, 'unauthenticated'],
    [419, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [422, 'validation'],
    [500, 'unexpected'],
])('normalizes HTTP %s without fallback or redirects', async (status, kind) => {
    const client = createHttpClient()
    client.defaults.adapter = async (config) => {
        throw new AxiosError('Failure', 'ERR_BAD_RESPONSE', config, undefined, {
            status: Number(status),
            statusText: 'Failure',
            headers: {},
            config,
            data: {},
        })
    }
    await expect(client.get('/synthetic-test')).rejects.toMatchObject({ kind })
})

it('keeps network failures as errors instead of returning fixture records', async () => {
    const client = createHttpClient()
    client.defaults.adapter = async () => {
        throw new AxiosError('Network failure')
    }
    await expect(client.get('/synthetic-test')).rejects.toMatchObject({ kind: 'network' })
})

it('preserves request cancellation', async () => {
    const client = createHttpClient()
    client.defaults.adapter = async () => {
        throw new CanceledError()
    }
    await expect(client.get('/synthetic-test')).rejects.toBeInstanceOf(CanceledError)
})
