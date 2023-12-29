import { Markup, Telegraf, session } from "telegraf";
import config from "config";
import { UserIdMatch } from "./constants.js";

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

const INITIAL_SESSION = {
  currentWard: null,
  giftMessage: "",
  giftImage: null,
};

bot.use(session());

const chatWithPresentsId = config.get("TELEGRAM_CHAT_ID");

bot.command("start", async (ctx) => {
  ctx.session = { ...INITIAL_SESSION };

  await ctx.reply(
    'Привет! Я принимаю текстовые сообщения и картинки для того, чтобы анонимно отправить их вашему подопечному 🌲 \n❗ Если в процессе что-то пошло не так и ты хочешь начать заново - напиши в чат "/start" \nДля начала работы выбери человека из списка ниже:',
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
  const session = ctx.session || { ...INITIAL_SESSION };

  if (!session.currentWard) {
    ctx.session = { ...INITIAL_SESSION };
  }

  const updatedButtons = Markup.inlineKeyboard([
    Markup.button.callback("• • •", "unused"),
  ]);

  const buttonLabel = ctx.match.input;
  const chosenName = UserIdMatch[buttonLabel].name;
  ctx.session.currentWard = chosenName;
  await ctx.reply(`Выбран подопечный: ${chosenName}`);
  await ctx.reply("Пришли сообщение, которое будет добавлено к подарку 📝");

  ctx.editMessageText("Подопечный выбран!", updatedButtons);
});

bot.on("text", async (ctx) => {
  const session = ctx.session || { ...INITIAL_SESSION };

  if (!session.currentWard) {
    ctx.session = { ...INITIAL_SESSION };

    await ctx.reply(
      "Сначала нужно выбрать подопечного для отправки подарка 🤔",
    );

    return;
  }

  const messageText = ctx.message.text;
  ctx.session.giftMessage = messageText;

  await ctx.reply(
    "Сообщение успешно сохранено, теперь можно добавить картинку или отправить только текст:",
    Markup.inlineKeyboard([
      [Markup.button.callback("Добавить картинку", "btn_add_image")],
      [Markup.button.callback("Отправить текст", "btn_send_text")],
    ]),
  );

  ctx.session.giftImage = null;
});

bot.action("btn_add_image", async (ctx) => {
  const session = ctx.session || { ...INITIAL_SESSION };

  if (!session.currentWard) {
    ctx.session = { ...INITIAL_SESSION };

    await ctx.reply(
      "Сначала нужно выбрать подопечного для отправки подарка 🤔",
    );

    return;
  }

  const updatedButtons = Markup.inlineKeyboard([
    Markup.button.callback("• • •", "unused"),
  ]);

  await ctx.reply(
    "Пришли в этот чат картинку, которую хочешь отправить получателю 🎆",
  );

  ctx.editMessageText("Выбор картинки...", updatedButtons);
});

bot.on("photo", async (ctx) => {
  const session = ctx.session || { ...INITIAL_SESSION };

  if (!session.currentWard) {
    ctx.session = { ...INITIAL_SESSION };

    await ctx.reply(
      "Сначала нужно выбрать подопечного для отправки подарка 🤔",
    );

    return;
  }

  const photo = ctx.message.photo;
  const photoToSend = photo[photo.length - 1].file_id;
  ctx.session.giftImage = photoToSend;

  await ctx.reply("Картинка успешно сохранена!");

  await ctx.reply(
    `Отправить выбранную картинку и сообщение «${ctx.session.giftMessage}» подопечному ${ctx.session.currentWard}?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Отправить", "btn_send_confirm")],
    ]),
  );
});

bot.action("btn_send_text", async (ctx) => {
  const session = ctx.session || { ...INITIAL_SESSION };

  if (!session.currentWard) {
    ctx.session = { ...INITIAL_SESSION };

    await ctx.reply(
      "Сначала нужно выбрать подопечного для отправки подарка 🤔",
    );

    return;
  }

  const updatedButtons = Markup.inlineKeyboard([
    Markup.button.callback("• • •", "unused"),
  ]);

  await ctx.reply(
    `Отправить сообщение «${ctx.session.giftMessage}» пользователю: ${ctx.session.currentWard}?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Отправить", "btn_send_confirm")],
    ]),
  );

  ctx.editMessageText("Подтверждение...", updatedButtons);
});

bot.action("btn_send_confirm", async (ctx) => {
  const session = ctx.session || { ...INITIAL_SESSION };

  if (!session.currentWard) {
    ctx.session = { ...INITIAL_SESSION };

    await ctx.reply(
      "Сначала нужно выбрать подопечного для отправки подарка 🤔",
    );

    return;
  }

  await ctx.telegram.sendMessage(
    chatWithPresentsId,
    `Подарок для: ${ctx.session.currentWard}`,
  );

  await ctx.telegram.sendMessage(
    chatWithPresentsId,
    `Сообщение от отправителя: ${ctx.session.giftMessage}`,
  );

  const updatedButtons = Markup.inlineKeyboard([
    Markup.button.callback("• • •", "unused"),
  ]);

  if (ctx.session.giftImage) {
    await ctx.telegram.sendPhoto(chatWithPresentsId, ctx.session.giftImage);
  }

  ctx.editMessageText("Готово", updatedButtons);

  await ctx.reply("Подарки отправлены! 🚀");
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
