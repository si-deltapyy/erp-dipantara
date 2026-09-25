import type {
    DetailResponse,
    ErrorEnvelope,
    PageMeta,
    PageResponse,
    RecordMetadata,
} from '@/core/types/contracts'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    parseStrings,
    requireKeys,
} from './value-parsers'

export function parsePageMeta(value: unknown): PageMeta {
    const meta = parseObject(value, 'meta')
    requireKeys(meta, ['page', 'perPage', 'total'], 'meta')
    return {
        page: parseInteger(meta.page, 'meta.page'),
        perPage: parseInteger(meta.perPage, 'meta.perPage', 1, 100),
        total: parseInteger(meta.total, 'meta.total', 0),
    }
}
export function parseDetail<T>(
    value: unknown,
    parse: (value: unknown, path: string) => T,
): DetailResponse<T> {
    const envelope = parseObject(value, 'response')
    requireKeys(envelope, ['data'], 'response')
    return { data: parse(envelope.data, 'data') }
}
export function parsePage<T>(
    value: unknown,
    parse: (value: unknown, path: string) => T,
): PageResponse<T> {
    const envelope = parseObject(value, 'response')
    requireKeys(envelope, ['data', 'meta'], 'response')
    if (!Array.isArray(envelope.data)) return invalidContract('data')
    return {
        data: envelope.data.map((record, index) => parse(record, `data.${index}`)),
        meta: parsePageMeta(envelope.meta),
    }
}
export function parseMetadata(value: unknown): RecordMetadata {
    const record = parseObject(value, 'record')
    return {
        version: parseInteger(record.version, 'version'),
        createdByUserId: parseId(record.createdByUserId, 'createdByUserId'),
        submittedByUserId:
            record.submittedByUserId === null
                ? null
                : parseId(record.submittedByUserId, 'submittedByUserId'),
        allowedActions: parseStrings(record.allowedActions, 'allowedActions'),
    }
}
export function parseErrorEnvelope(value: unknown): ErrorEnvelope {
    const envelope = parseObject(value, 'error')
    requireKeys(envelope, ['message', 'code', 'errors', 'requestId'], 'error')
    const errors =
        envelope.errors === undefined
            ? undefined
            : Object.fromEntries(
                  Object.entries(parseObject(envelope.errors, 'errors')).map(([path, messages]) => [
                      path,
                      parseStrings(messages, `errors.${path}`),
                  ]),
              )
    return {
        message: parseString(envelope.message, 'message'),
        code: parseString(envelope.code, 'code'),
        errors,
        requestId:
            envelope.requestId === undefined
                ? undefined
                : parseString(envelope.requestId, 'requestId'),
    }
}
