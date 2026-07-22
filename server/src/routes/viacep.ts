import { Router, Request, Response } from 'express'

const router = Router()

router.get('/:cep', async (req: Request, res: Response) => {
  const cep = Array.isArray(req.params.cep) ? req.params.cep[0] : req.params.cep
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    res.status(400).json({ error: 'CEP inválido' })
    return
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const data: any = await response.json()
    
    if (data.erro) {
      res.status(404).json({ error: 'CEP não encontrado' })
      return
    }
    
    res.json({
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      complement: data.complemento,
    })
  } catch {
    res.status(500).json({ error: 'Erro ao buscar CEP' })
  }
})

export default router