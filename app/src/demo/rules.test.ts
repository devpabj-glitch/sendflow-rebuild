import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculatedFull, countsAsFull, entryPercent, periodPhrase, sortByUpdated } from './rules.ts'

describe('regras de demonstração', () => {
  it('o texto do período segue o botão escolhido', () => {
    assert.equal(periodPhrase('7'), 'Cliques, entradas e saídas dos últimos 7 dias.')
    assert.equal(periodPhrase('90'), 'Cliques, entradas e saídas dos últimos 90 dias.')
  })

  it('percentual de entrada não trata zero clique como erro', () => {
    assert.equal(entryPercent(0, 3), 0)
    assert.equal(entryPercent(10, 4), 40)
  })

  it('lotação calculada compara participantes com o limite', () => {
    assert.equal(calculatedFull(50, 50), true)
    assert.equal(calculatedFull(49, 50), false)
    assert.equal(calculatedFull(10, 0), false)
  })

  it('o filtro cheio aceita manual ou calculado', () => {
    assert.equal(countsAsFull(true, false), true)
    assert.equal(countsAsFull(false, true), true)
    assert.equal(countsAsFull(false, false), false)
  })

  it('ordenação usa atualização e cai para criação', () => {
    const rows = sortByUpdated([
      { id: 'a', createdAt: '2026-01-01', updatedAt: '2026-02-01' },
      { id: 'b', createdAt: '2026-03-01' },
    ])
    assert.deepEqual(rows.map(r => r.id), ['b', 'a'])
  })
})
