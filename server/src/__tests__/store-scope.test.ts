import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { initDatabase, dbGet, dbAll, dbRun } from '../database'
import { applyStoreScope, runWithStoreScope } from '../store-scope'

describe('applyStoreScope', () => {
  it('escopa SELECT com WHERE existente', () => {
    const res = applyStoreScope('SELECT * FROM orders WHERE id = ?', ['ord1'], 'storeA')
    expect(res!.sql).toBe('SELECT * FROM orders WHERE (id = ?) AND store_id = ?')
    expect(res!.params).toEqual(['ord1', 'storeA'])
  })

  it('escopa SELECT com WHERE e ORDER BY', () => {
    const res = applyStoreScope('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', ['pending'], 'storeA')
    expect(res!.sql).toBe('SELECT * FROM orders WHERE (status = ?) AND store_id = ? ORDER BY created_at DESC')
    expect(res!.params).toEqual(['pending', 'storeA'])
  })

  it('escopa SELECT sem WHERE', () => {
    const res = applyStoreScope('SELECT * FROM orders ORDER BY created_at DESC', [], 'storeA')
    expect(res!.sql).toBe('SELECT * FROM orders WHERE store_id = ? ORDER BY created_at DESC')
    expect(res!.params).toEqual(['storeA'])
  })

  it('escopa SELECT com alias e JOIN', () => {
    const sql = 'SELECT p.*, c.name as category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.is_available = 1 ORDER BY c."order", p.name'
    const res = applyStoreScope(sql, [], 'storeA')
    expect(res!.sql).toBe('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE (p.is_available = 1) AND p.store_id = ? ORDER BY c."order", p.name')
    expect(res!.params).toEqual(['storeA'])
  })

  it('escopa SELECT com alias JOIN sem WHERE', () => {
    const sql = 'SELECT cg.*, p.name as product_name FROM complement_groups cg JOIN products p ON p.id = cg.product_id ORDER BY p.name, cg.name'
    const res = applyStoreScope(sql, [], 'storeA')
    expect(res!.sql).toBe('SELECT cg.*, p.name as product_name FROM complement_groups cg JOIN products p ON p.id = cg.product_id WHERE cg.store_id = ? ORDER BY p.name, cg.name')
  })

  it('escopa SELECT com expressão com parênteses e LIMIT', () => {
    const sql = 'SELECT id, name, phone FROM customers WHERE store_id = ? AND (name LIKE ? OR phone LIKE ?) LIMIT 20'
    const res = applyStoreScope(sql, ['storeA', '%x%', '%y%'], 'storeB')
    expect(res!.sql).toBe('SELECT id, name, phone FROM customers WHERE (store_id = ? AND (name LIKE ? OR phone LIKE ?)) AND store_id = ? LIMIT 20')
    expect(res!.params).toEqual(['storeA', '%x%', '%y%', 'storeB'])
  })

  it('escopa SELECT com função DATE', () => {
    const sql = "SELECT COUNT(*) as c FROM orders WHERE store_id = ? AND created_at >= DATE('now','start of month')"
    const res = applyStoreScope(sql, ['storeA'], 'storeB')
    expect(res!.sql).toBe("SELECT COUNT(*) as c FROM orders WHERE (store_id = ? AND created_at >= DATE('now','start of month')) AND store_id = ?")
    expect(res!.params).toEqual(['storeA', 'storeB'])
  })

  it('escopa UPDATE', () => {
    const res = applyStoreScope('UPDATE products SET name = ?, updated_at = datetime(\'now\') WHERE id = ?', ['Novo', 'p1'], 'storeA')
    expect(res!.sql).toBe('UPDATE products SET name = ?, updated_at = datetime(\'now\') WHERE (id = ?) AND store_id = ?')
    expect(res!.params).toEqual(['Novo', 'p1', 'storeA'])
  })

  it('escopa DELETE', () => {
    const res = applyStoreScope('DELETE FROM products WHERE id = ?', ['p1'], 'storeA')
    expect(res!.sql).toBe('DELETE FROM products WHERE (id = ?) AND store_id = ?')
    expect(res!.params).toEqual(['p1', 'storeA'])
  })

  it('injeta store_id em INSERT sem escopo (default main)', () => {
    const res = applyStoreScope('INSERT INTO orders (id, customer_id, total) VALUES (?, ?, ?)', ['o1', 'c1', 10], null)
    expect(res!.sql).toBe('INSERT INTO orders (id, customer_id, total, store_id) VALUES (?, ?, ?, ?)')
    expect(res!.params).toEqual(['o1', 'c1', 10, 'main'])
  })

  it('injeta store_id do escopo em INSERT', () => {
    const res = applyStoreScope('INSERT INTO orders (id, customer_id, total) VALUES (?, ?, ?)', ['o1', 'c1', 10], 'storeB')
    expect(res!.sql).toBe('INSERT INTO orders (id, customer_id, total, store_id) VALUES (?, ?, ?, ?)')
    expect(res!.params).toEqual(['o1', 'c1', 10, 'storeB'])
  })

  it('não duplica store_id em INSERT que já o possui', () => {
    const sql = 'INSERT INTO users (id, name, email, password, role, store_id) VALUES (?, ?, ?, ?, ?, ?)'
    expect(applyStoreScope(sql, ['u1', 'N', 'e', 'p', 'owner', 'storeA'], 'storeA')).toBeNull()
  })

  it('não escopa INSERT em company_settings (PK é o store id)', () => {
    expect(applyStoreScope('INSERT INTO company_settings (id, store_name) VALUES (?, ?)', ['s1', 'Loja'], null)).toBeNull()
  })

  it('escopa company_settings pela coluna id', () => {
    const res = applyStoreScope('SELECT * FROM company_settings WHERE id = ?', ['s1'], 'storeA')
    expect(res!.sql).toBe('SELECT * FROM company_settings WHERE (id = ?) AND id = ?')
    expect(res!.params).toEqual(['s1', 'storeA'])
  })

  it('não escopa tabelas de plataforma (subscriptions)', () => {
    const sql = 'SELECT plan FROM subscriptions WHERE store_id = ? ORDER BY created_at DESC LIMIT 1'
    expect(applyStoreScope(sql, ['storeA'], 'storeA')).toBeNull()
  })

  it('não escopa leitura pública sem escopo', () => {
    expect(applyStoreScope('SELECT * FROM products WHERE id = ?', ['p1'], null)).toBeNull()
  })

  it('não escopa UPDATE/DELETE sem escopo (rotas públicas)', () => {
    expect(applyStoreScope('UPDATE users SET password = ? WHERE id = ?', ['x', 'u1'], null)).toBeNull()
    expect(applyStoreScope('DELETE FROM orders WHERE id = ?', ['o1'], null)).toBeNull()
  })
})

describe('isolamento multi-loja (integração)', () => {
  beforeAll(async () => {
    await initDatabase()
    dbRun('DELETE FROM products WHERE id IN (?, ?)', ['scope-prod-a', 'scope-prod-b'])
  })

  afterAll(() => {
    dbRun('DELETE FROM products WHERE id = ?', ['scope-prod-a'])
    dbRun('DELETE FROM products WHERE id = ?', ['scope-prod-b'])
  })

  it('loja A não enxerga dados da loja B', () => {
    runWithStoreScope('storeA', () => {
      dbRun('INSERT INTO products (id, name, description, price, category_id) VALUES (?, ?, ?, ?, ?)',
        ['scope-prod-a', 'Produto A', '', 10, 'cat1'])
    })
    runWithStoreScope('storeB', () => {
      dbRun('INSERT INTO products (id, name, description, price, category_id) VALUES (?, ?, ?, ?, ?)',
        ['scope-prod-b', 'Produto B', '', 20, 'cat1'])
    })

    runWithStoreScope('storeA', () => {
      expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-a'])?.name).toBe('Produto A')
      expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-b'])).toBeNull()
    })
    runWithStoreScope('storeB', () => {
      expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-a'])).toBeNull()
      expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-b'])?.name).toBe('Produto B')
    })

    expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-a'])?.store_id).toBe('storeA')
  })

  it('UPDATE escopado não altera produto de outra loja', () => {
    runWithStoreScope('storeA', () => {
      dbRun('UPDATE products SET name = ? WHERE id = ?', ['Hack A', 'scope-prod-b'])
    })
    runWithStoreScope('storeB', () => {
      expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-b'])?.name).toBe('Produto B')
    })
  })

  it('UPDATE escopado altera produto da própria loja', () => {
    runWithStoreScope('storeA', () => {
      dbRun('UPDATE products SET name = ? WHERE id = ?', ['Produto A v2', 'scope-prod-a'])
    })
    runWithStoreScope('storeA', () => {
      expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-a'])?.name).toBe('Produto A v2')
    })
  })

  it('DELETE escopado não remove produto de outra loja', () => {
    runWithStoreScope('storeA', () => {
      dbRun('DELETE FROM products WHERE id = ?', ['scope-prod-b'])
    })
    runWithStoreScope('storeB', () => {
      expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-b'])?.name).toBe('Produto B')
    })
  })

  it('leitura global sem escopo vê todas as lojas', () => {
    expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-a'])?.name).toBe('Produto A v2')
    expect(dbGet('SELECT * FROM products WHERE id = ?', ['scope-prod-b'])?.name).toBe('Produto B')
  })

  it('dbAll também é escopado', () => {
    runWithStoreScope('storeA', () => {
      const rows = dbAll('SELECT * FROM products WHERE id IN (?, ?)', ['scope-prod-a', 'scope-prod-b'])
      expect(rows.length).toBe(1)
      expect(rows[0].id).toBe('scope-prod-a')
    })
  })
})
