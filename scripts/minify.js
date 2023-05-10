const fs = require('fs');
const readline = require('readline');

const filename = '.stylelintignore';

const loopThroughFolders = (path) => {
  const files = fs.readdirSync(path);

  if (!files.length) {
    return;
  }

  const hasCssFiles = files.findIndex((p) => p.includes('.css')) !== -1;
  const subFolders = files.filter((p) => !p.includes('.'));

  if (hasCssFiles) {
    return true;
  }

  if (!hasCssFiles && !subFolders.length) {
    return;
  }

  for (const file of subFolders) {
    if (loopThroughFolders(`${path}${file}/`)) {
      return true;
    }
  }
};

const hasPath = (path) => {
  return fs.existsSync(path);
};

const shouldKeepLine = (line) => {
  if (line.includes('**/*.')) {
    const parentFolderPath = line.split('**/*.')[0];

    if (hasPath(parentFolderPath)) {
      return loopThroughFolders(parentFolderPath);
    }

    return false;
  }

  if (line.includes('*.css')) {
    const parentFolderPath = line.split('*.css')[0];

    if (hasPath(parentFolderPath)) {
      const files = fs.readdirSync(parentFolderPath);

      const hasCssFiles = files.findIndex((p) => p.includes('.css')) !== -1;

      return hasCssFiles ? true : false;
    }

    return false;
  }

  return hasPath(line);
};

async function processLineByLine() {
  const fileStream = fs.createReadStream(filename);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;

    const isFound = shouldKeepLine(line);

    if (isFound) {
      if (lineNum > 1) {
        fs.appendFileSync(__dirname.split('scripts')[0] + filename, `${line}\n`);
      } else {
        fs.writeFileSync(__dirname.split('scripts')[0] + filename, `${line}\n`);
      }
    }
  }
}

const removeLineBreaks = (text) => {
  return text.replace(/\r?\n/g, ' ');
};

processLineByLine().then(() => {
  const minifiedFile = fs.readFileSync(filename, 'utf8');
  fs.writeFileSync(filename, removeLineBreaks(minifiedFile));
});
