const { bot } = require('../config/telegram')
const { axios } = require('../config/axios')
const { moment } = require('../config/moment')
const { getSign } = require('../signs')
const { isValidDate } = require('../utils')
const { customKb, defaultKb } = require('../msgOptions')
const { buildYesNoOptions } = require('../keyboardTemplates')

const tryAgain = (callbackId, chatId, userId, userFullName, userName) => {
  global.answerCallbacks[callbackId] = async answerConfirmation => {
    const answerConfirmationId = answerConfirmation.message_id
    const answerConfirmationMsg = answerConfirmation.text ? answerConfirmation.text.toLowerCase() : ''

    if (answerConfirmationMsg === 'sim' || answerConfirmationMsg === 's') {
      getBirthdate(callbackId, chatId, userId, answerConfirmationId, userFullName, userName)
    } else if (answerConfirmationMsg === 'não' || answerConfirmationMsg === 'nao' || answerConfirmationMsg === 'n') {
      bot.sendMessage(chatId, 'Processo cancelado...', defaultKb(answerConfirmationId))
    } else {
      await bot.sendMessage(
        chatId,
        `🤔 Não entendi, tente novamente.`,
        customKb(answerConfirmationId, buildYesNoOptions())
      )
      tryAgain(callbackId, chatId, userId, userFullName, userName)
    }
  }
}

const confirmedBirthdate = (callbackId, chatId, userId, userFullName, userName, date) => {
  global.answerCallbacks[callbackId] = async answerConfirmation => {
    const answerConfirmationId = answerConfirmation.message_id
    const answerConfirmationMsg = answerConfirmation.text ? answerConfirmation.text.toLowerCase() : ''

    if (answerConfirmationMsg === 'sim' || answerConfirmationMsg === 's') {
      const sign = getSign(date).filter(signEl => date.within(signEl.range))[0]
      const tararau = {
        chatId,
        userId,
        userName,
        userFullName,
        signName: sign.name,
        signSymbol: sign.symbol,
        birthdate: date
      }

      console.log(`Salvando tararau ${JSON.stringify(tararau)}... /tararaus/${chatId}`)

      axios
        .post(`/tararaus/${chatId}`, tararau)
        .then(() => {
          bot.sendMessage(
            chatId,
            `Data registrada com sucesso... não sabia que seu signo era ${sign.name} ${sign.symbol}`,
            defaultKb(answerConfirmationId)
          )
        })
        .catch(e => console.error(e))
    } else if (answerConfirmationMsg === 'não' || answerConfirmationMsg === 'nao' || answerConfirmationMsg === 'n') {
      getBirthdate(callbackId, chatId, userId, answerConfirmationId, userFullName, userName)
    } else {
      await bot.sendMessage(
        chatId,
        '🤔 Não entendi, gostaria de tentar novamente?',
        customKb(answerConfirmationId, buildYesNoOptions())
      )
      tryAgain(callbackId, chatId, userId, userFullName, userName)
    }
  }
}

const receivedBirthdate = (callbackId, chatId, userId, userFullName, userName) => {
  global.answerCallbacks[callbackId] = async answerBirthdate => {
    const answerBirthdateId = answerBirthdate.message_id

    if (isValidDate(answerBirthdate.text, true)) {
      const date = moment(answerBirthdate.text, 'D/M/YYYY')

      await bot.sendMessage(
        chatId,
        `Você nasceu dia ${date.format('D [de] MMMM [de] YYYY [(]dddd[)]').toLowerCase()}?`,
        customKb(answerBirthdateId, buildYesNoOptions())
      )
      confirmedBirthdate(callbackId, chatId, userId, userFullName, userName, date)
    } else {
      await bot.sendMessage(
        chatId,
        `⚠️ *Data inválida*
Preste atenção no formato.

Gostaria de tentar novamente?`,
        customKb(answerBirthdateId, buildYesNoOptions())
      )
      tryAgain(callbackId, chatId, userId, userFullName, userName)
    }
  }
}

const getBirthdate = async (callbackId, chatId, userId, msgId, userFullName, userName) => {
  await bot.sendMessage(chatId, `Por gentileza, insira sua data (DD/MM/AAAA) de nascimento 🙂`, defaultKb(msgId, true))
  receivedBirthdate(callbackId, chatId, userId, userFullName, userName)
}

module.exports = {
  getBirthdate
}
