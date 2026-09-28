import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type * as ScenarioModule from '../payment-scenario'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/payment-repository'
import type * as FixturesModule from '../../../resources/js/src/api/mocks/session-fixtures'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Payment tabs mock')
async function approve(
    page: Page,
    id: string,
    version: number,
    generation: string,
): Promise<string> {
    return page.evaluate(
        async ({ id, version, generation }) => {
            const origin = new URL(
                document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                    location.origin,
            ).origin
            const { PaymentRepository } = (await import(
                origin + '/resources/js/src/api/mocks/persistence/payment-repository.ts'
            )) as typeof RepositoryModule
            const { sessionFixtures } = (await import(
                origin + '/resources/js/src/api/mocks/session-fixtures.ts'
            )) as typeof FixturesModule
            const actor = sessionFixtures.find((user) => user.id === 'supervisor-demo')
            if (!actor) throw new Error('Missing reviewer')
            try {
                return (
                    await new PaymentRepository().mutate(
                        actor,
                        { action: 'approve', id, input: { version }, key: 'tab-approval' },
                        generation,
                        new AbortController().signal,
                    )
                ).status
            } catch (cause) {
                return (cause as { kind: string }).kind
            }
        },
        { id, version, generation },
    )
}
test('two browser tabs cannot approve more credit than the issued invoice allows', async ({
    page,
    context,
}) => {
    await page.goto('/app')
    const setup = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createPaymentScenario, createSubmittedPayment } = (await import(
            origin + '/tests/frontend/payment-scenario.ts'
        )) as typeof ScenarioModule
        const scenario = await createPaymentScenario('woodflow-demo')
        const first = await createSubmittedPayment(scenario, scenario.owner, '1000000.00')
        const second = await createSubmittedPayment(scenario, scenario.owner, '1000000.00')
        return { first, second, generation: scenario.generation }
    })
    const other = await context.newPage()
    await other.goto('/app')
    const outcomes = await Promise.all([
        approve(page, setup.first.id, setup.first.version, setup.generation),
        approve(other, setup.second.id, setup.second.version, setup.generation),
    ])
    expect(outcomes.sort()).toEqual(['approved', 'conflict'])
    await other.close()
})
