export type FixtureLayer = 'L0' | 'L1' | 'L2'

export interface FixtureManifest {
  id: string
  category: string
  layer: FixtureLayer
  expected?: {
    classification?: string
    core?: string
    mcVersion?: string
    java?: number
    deployResult?: string
  }
}

const fixtures: FixtureManifest[] = [
  { id: 'GS-POS-001', category: 'positive', layer: 'L2', expected: { core: 'Vanilla', mcVersion: '1.20.1', java: 17, deployResult: 'local-ready' } },
  { id: 'GS-POS-002', category: 'positive', layer: 'L2', expected: { core: 'Vanilla', mcVersion: '1.21.1', java: 21, deployResult: 'local-ready' } },
  { id: 'GS-POS-003', category: 'positive', layer: 'L2', expected: { core: 'Paper', mcVersion: '1.20.1', java: 17, deployResult: 'local-ready' } },
  { id: 'GS-POS-004', category: 'positive', layer: 'L2', expected: { core: 'Paper', mcVersion: '1.21.1', java: 21, deployResult: 'local-ready' } },
  { id: 'GS-POS-005', category: 'positive', layer: 'L2', expected: { core: 'Fabric', mcVersion: '1.20.1', java: 17, deployResult: 'local-ready' } },
  { id: 'GS-POS-006', category: 'positive', layer: 'L2', expected: { core: 'Fabric', mcVersion: '1.21.1', java: 21, deployResult: 'local-ready' } },
  { id: 'GS-POS-007', category: 'positive', layer: 'L2', expected: { core: 'Forge', mcVersion: '1.20.1', java: 17, deployResult: 'local-ready' } },
  { id: 'GS-POS-008', category: 'positive', layer: 'L2', expected: { core: 'NeoForge', mcVersion: '1.21.1', java: 21, deployResult: 'local-ready' } },
]

export function getFixture(id: string): FixtureManifest {
  const fixture = fixtures.find((item) => item.id === id)
  if (!fixture) throw new Error(`UNKNOWN_FIXTURE:${id}`)
  return fixture
}

export function listFixtures(layer?: FixtureLayer): FixtureManifest[] {
  return fixtures.filter((fixture) => layer === undefined || fixture.layer === layer)
}
