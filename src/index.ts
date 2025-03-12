import { Command } from 'commander'
import figlet from 'figlet'
import chalk from 'chalk'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { promises as fs } from 'fs'
import { join } from 'path'

const program = new Command()
const passwordDir = join(process.cwd(), 'passwords')
const algorithm = 'aes-256-ctr'
const secretKey = randomBytes(32)
const iv = randomBytes(16)

const encrypt = (text: string) => {
  const cipher = createCipheriv(algorithm, secretKey, iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

console.log(figlet.textSync("Pass Generator"))

program
  .version("1.0.0")
  .description("An example CLI for managing passwords and creating them")

program.parse()
