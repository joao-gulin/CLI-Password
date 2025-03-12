import { Command } from 'commander'
import figlet from 'figlet'
import chalk from 'chalk'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { promises as fs } from 'fs'
import { join, parse } from 'path'

const program = new Command()
const passwordDir = join(process.cwd(), 'passwords')
const algorithm = 'aes-256-ctr'
const secretKey = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8');


const encrypt = (text: string): string => {
  const iv = randomBytes(16); // New IV for each encryption
  const cipher = createCipheriv(algorithm, secretKey, iv);
  // Encrypt using 'utf8' as input encoding
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  // Combine IV and ciphertext, then encode as base64
  const combined = Buffer.concat([iv, encrypted]);
  return combined.toString('base64');
};

const decrypt = (data: string): string => {
  // Decode base64 to retrieve the combined Buffer
  const combined = Buffer.from(data, 'base64');
  // The first 16 bytes are the IV
  const iv = combined.slice(0, 16);
  // The remainder is the ciphertext
  const encryptedText = combined.slice(16);
  const decipher = createDecipheriv(algorithm, secretKey, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
};

const generatePassword = (length: number) => {
  return randomBytes(length).toString('base64').slice(0, length)
}

// Help command
program
  .name('password-manager')
  .description('Initialize the password storage directory.')
  .version('1.0.0')

// Command for initianting the password directory
program
  .command('init')
  .description('Initialize the password storage directory.')
  .action(async () => {
    await fs.mkdir(passwordDir, { recursive: true })
    console.log(chalk.green('Password storage initialized.'))
  })

// Commmand for generating the encryptedPassword
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

// Command for decrypt and showing the password
program
  .command('retrieve <name>')
  .description('Retrieve and decrypt a stored password')
  .action(async (name) => {
    const filePath = join(passwordDir, `${name}.txt`)
    try {
      const encryptedPassword = await fs.readFile(filePath, 'utf8')
      const password = decrypt(encryptedPassword)
      console.log(chalk.yellow(`Password for ${name}: ${password}`));
    } catch (error) {
      console.error(chalk.red('Error retrieving password. Ensure the password exists'))
    }
  })

// List the passwords in the passwords directory\
program
  .command('list')
  .description('List all stored passwords.')
  .action(async () => {
    try {
      const files = await fs.readdir(passwordDir)
      const names = files.map((file) => file.replace('.txt', ''))
      console.log(chalk.magenta('Stored Passwords:'))
      names.forEach((name) => console.log(`- ${name}`))
    } catch (error) {
      console.error(chalk.red('Error listing passwords.'))
    }
  })

console.log(chalk.cyan(figlet.textSync('Password Manager')))
program.parse(process.argv)
