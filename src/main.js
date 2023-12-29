import { Markup, Telegraf, session } from "telegraf";
import config from "config";
import { UserIdMatch } from "./constants.js";

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

const chatWithPresentsId = config.get("TELEGRAM_CHAT_ID");
let currentWard = null;

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Привет! Я принимаю текстовые сообщения и картинки для того, чтобы анонимно отправить их вашему подопечному 🌲 Выберите человека из списка ниже:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(UserIdMatch.btn_1.name, "btn_1"),
        Markup.button.callback(UserIdMatch.btn_2.name, "btn_2"),
        Markup.button.callback(UserIdMatch.btn_3.name, "btn_3"),
      ],
      [
        Markup.button.callback(UserIdMatch.btn_4.name, "btn_4"),
        Markup.button.callback(UserIdMatch.btn_5.name, "btn_5"),
        Markup.button.callback(UserIdMatch.btn_6.name, "btn_6"),
      ],
      [
        Markup.button.callback(UserIdMatch.btn_7.name, "btn_7"),
        Markup.button.callback(UserIdMatch.btn_8.name, "btn_8"),
        Markup.button.callback(UserIdMatch.btn_9.name, "btn_9"),
      ],
    ]),
  );
});

bot.action(/btn_[1-9]/, async (ctx) => {
  const buttonLabel = ctx.match.input;
  const chosenName = UserIdMatch[buttonLabel].name;
  currentWard = chosenName;
  await ctx.reply(`Выбран подопечный: ${chosenName}`);
  await ctx.reply(
    "Пришлите сообщение или картинку для отправки подопечному 🏞 📝",
  );
});

bot.on("message", async (ctx) => {
  if (!currentWard) {
    await ctx.reply(
      "Сначала нужно выбрать подопечного для отправки подарка 🤔",
    );
  } else {
    await ctx.telegram.sendMessage(
      chatWithPresentsId,
      `Подарок для: ${currentWard}`,
    );
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
