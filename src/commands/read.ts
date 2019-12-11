import { Command, flags } from "@oclif/command";
import axios from "axios";
const { red, green, yellow } = require("kleur");
const fs = require("fs");

const getPackageLastVersion = async function(name: string) {
  // TODO научиться ходить в нексусы и прочие приватные репозитории
  const { data } = await axios.get(`https://registry.npmjs.org/${name}/latest`);
  return data.version;
};

const compareVersion = (current: string, last: string) => {
  //TODO проверять первый символ на цифру, уточнить формат в доке
  if (current[0] === "^") {
    return current.slice(1) === last;
  }
  return current === last;
};

const checkAB = (version: string) => {
  // TODO нужна нормальная проверка на литералы, если есть что-то кроме цифр, точки и тире
  // TODO проверка на 0.1.0 версии, тоже о них предупреждать, но желтым
  return (
    version.includes("alfa") ||
    version.includes("beta") ||
    version.includes("rc")
  );
};

const addPrettier = async (data: any) => {
  return {
    ...data.dependencies,
    husky: await getPackageLastVersion("husky"),
    prettier: await getPackageLastVersion("prettier"),
    "pretty-quick": await getPackageLastVersion("pretty-quick")
  };
};

const addHuskyHook = async (data: any) => {
  const husky = {
    husky: {
      hooks: {
        "pre-commit": "pretty-quick --staged --bail"
      }
    }
  };
  return Object.assign(data, husky);
};

export default class Read extends Command {
  static description = "read package.json";
  /*
  static examples = [];

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" })
  };*/

  static args = [{ name: "file" }];

  async run() {
    const { args, flags } = this.parse(Read);
    const packageData = fs.readFileSync("package.json");
    let data = JSON.parse(packageData);

    // TODO Сделать автоматическое определение самого длинного имени
    // TODO Сделать проверку разных виды зависимостей
    // TODO Распараллелить загрузку информации о пакетах
    this.log(yellow(`${"name".padEnd(30)}${"current".padEnd(20)}latest`));
    for (let item in data.dependencies) {
      const latestVersion = await getPackageLastVersion(item);
      this.log(
        item.padEnd(30),
        checkAB(data.dependencies[item])
          ? red(data.dependencies[item].padEnd(20))
          : data.dependencies[item].padEnd(20),
        compareVersion(data.dependencies[item], latestVersion)
          ? green(latestVersion)
          : red(latestVersion)
      );
    }

    // TODO добавить хаски на прекоммит, нужно вынести в отдельную команду
    // TODO нужно получать последние версии преттиера, хаски и претти-квика
    // TODO нужно добавить возможность добавить eslint, посмотреть еще возможность кастомизировать строку

    data.dependencies = await addPrettier(data.dependencies);
    data = await addHuskyHook(data);

    // TODO сделать сохранение с форматированием
    fs.writeFileSync("package.json", JSON.stringify(data));
  }
}
