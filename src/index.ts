import { Command } from 'commander'
import figlet from 'figlet'
import chalk from 'chalk'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { promises as fs } from 'fs'
import { join, parse } from 'path'
import { password } from 'bun'

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

const decrypt = (hash: string) => {
  const [ivHex, encryptedHex] = hash.split(':')
  const decipher = createDecipheriv(algorithm, secretKey, Buffer.from(ivHex, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ])
  return decrypted.toString()
}

const generatePassword = (length: number) => {
  return randomBytes(length).toString('base64').slice(0, length)
}


program
  .name('password-manager')
  .description('Initialize the password storage directory.')
  .version('1.0.0')

program
  .command('init')
  .description('Initialize the password storage directory.')
  .action(async () => {
    await fs.mkdir(passwordDir, { recursive: true })
    console.log(chalk.green('Password storage initialized.'))
  })

program
  .command('generate <name>')
  .description('Generate a new passwrod and store it')
  .option('-l, --length <number>', 'Length of the password', '16')
  .action(async (name, options) => {
    const length = parseInt(options.length, 10)
    const password = generatePassword(length)
    const encryptedPassword = encrypt(password)
    const filePath = join(passwordDir, `${name}.txt`)
    await fs.writeFile(filePath, encryptedPassword)
    console.log(chalk.blue(`Password for ${name} generated and stored.`))
  })

console.log(chalk.cyan(figlet.textSync('Password Manager')))
program.parse(process.argv)
