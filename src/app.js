process.env.NTBA_FIX_319 = 1
const { bot } = require('./config/telegram')
const { axios } = require('./config/axios')
const { moment } = require('./config/moment')
require('./server')
const { msgMatches } = require('./msgMatches')
const { customKb, defaultKb } = require('./msgOptions')
const { listBirthdays, listRoles, isValidTime, isValidDate, isFutureDate } = require('./utils')
const { buildDayOptions } = require('./keyboardTemplates')
const { getBirthdate } = require('./commands/bday')

// const maps = `https://maps.googleapis.com/maps/api/geocode/json?${parameters}&key=${process.env.GOOGLE_API_KEY}`

// const places = []
console.log(axios.defaults)

global.answerCallbacks = {}

bot.on('message', msg => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  const msgId = msg.message_id
  const userMsg = msg.text ? msg.text.toLowerCase() : ''
  const userFirstName = msg.from.first_name
  const userName = `[${userFirstName}](tg://user?id=${userId})`
  const callbackId = `${chatId}:${userId}`

  const callback = global.answerCallbacks[callbackId]
  if (callback) {
    delete global.answerCallbacks[callbackId]
    return callback(msg)
  }

  if (userMsg && !userMsg.startsWith('/')) {
    msgMatches(chatId, msgId, userMsg, userName)
  }

  return true
})

bot.onText(/^\/role\b/i, msg => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  const msgId = msg.message_id
  const callbackId = `${chatId}:${userId}`

  bot.sendMessage(chatId, 'Quando vocês querem meter o loko?', customKb(msgId, buildDayOptions(moment()))).then(() => {
    global.answerCallbacks[callbackId] = answerRoleDate => {
      const answerRoleDateId = answerRoleDate.message_id

      if (answerRoleDate.text === 'Outra data') {
        bot.sendMessage(chatId, 'Digite uma data (DD/MM/AA) futura', defaultKb(answerRoleDateId, true)).then(() => {
          global.answerCallbacks[callbackId] = answerAnotherDate => {
            const answerAnotherDateId = answerAnotherDate.message_id

            if (isValidDate(answerAnotherDate.text) && isFutureDate(answerAnotherDate.text)) {
              const date = moment(answerAnotherDate.text, 'D/M/YY')

              bot
                .sendMessage(
                  chatId,
                  `${date.format('DD/MM/YY [(]dddd[)]').toLowerCase()}, qual horário (HH:mm)?`,
                  defaultKb(answerAnotherDateId, true)
                )
                .then(() => {
                  global.answerCallbacks[callbackId] = answerRoleTime => {
                    const answerRoleTimeId = answerRoleTime.message_id

                    if (isValidTime(answerRoleTime.text, date)) {
                      const fullDate = date

                      bot.sendMessage(chatId, `Digite o local do rolê`, defaultKb(answerRoleTimeId, true)).then(() => {
                        global.answerCallbacks[callbackId] = answerRoleLocation => {
                          const answerRoleLocationId = answerRoleLocation.message_id
                          const location = answerRoleLocation.text

                          bot
                            .sendMessage(
                              chatId,
                              `Agora, dê um nome tararau para o rolê!`,
                              defaultKb(answerRoleLocationId, true)
                            )
                            .then(() => {
                              global.answerCallbacks[callbackId] = answerRoleTitle => {
                                const answerRoleTitleId = answerRoleTitle.message_id
                                const title = answerRoleTitle.text
                                const role = {
                                  chatId,
                                  title,
                                  date: fullDate,
                                  location
                                }

                                console.log(fullDate.format('DD/MM/YY [às] H[h]mm'))

                                axios
                                  .post(`/roles/${chatId}`, role)
                                  .then(() => {
                                    bot.sendMessage(
                                      chatId,
                                      `Rolê *${role.title}* marcado para ${role.date.calendar().toLowerCase()} no(a) _${
                                        role.location
                                      }_!`,
                                      defaultKb(answerRoleTitleId)
                                    )
                                  })
                                  .catch(e => console.error(e))
                              }
                            })
                        }
                      })
                    } else {
                      bot.sendMessage(
                        chatId,
                        `⚠️ *Data inválida*
                    
Escolha uma data futura e preste atenção no formato`,
                        defaultKb(answerRoleTimeId)
                      )
                    }
                  }
                })
            } else {
              bot.sendMessage(
                chatId,
                `⚠️ *Data inválida*
                    
Escolha uma data futura e preste atenção no formato`,
                defaultKb(answerAnotherDateId)
              )
            }
          }
        })
      } else if (answerRoleDate.text === 'Mudei de ideia') {
        bot.sendMessage(chatId, `Então tá 👋`, defaultKb(answerRoleDateId))
      } else if (moment(answerRoleDate.text.split('\n')[1].slice(1, -1), 'D/MMM/YY', 'pt-br', true).isValid()) {
        const date = moment(answerRoleDate.text.split('\n')[1].slice(1, -1), 'D/MMM/YY')

        bot
          .sendMessage(
            chatId,
            `${date.format('DD/MM/YY [(]dddd[)]').toLowerCase()}, qual horário (HH:mm)?`,
            defaultKb(answerRoleDateId, true)
          )
          .then(() => {
            global.answerCallbacks[callbackId] = answerRoleTime => {
              const answerRoleTimeId = answerRoleTime.message_id

              if (isValidTime(answerRoleTime.text, date)) {
                const fullDate = date

                bot.sendMessage(chatId, `Digite o local do rolê`, defaultKb(answerRoleTimeId, true)).then(() => {
                  global.answerCallbacks[callbackId] = answerRoleLocation => {
                    const answerRoleLocationId = answerRoleLocation.message_id
                    const location = answerRoleLocation.text

                    bot
                      .sendMessage(
                        chatId,
                        `Agora, dê um nome tararau para o rolê!`,
                        defaultKb(answerRoleLocationId, true)
                      )
                      .then(() => {
                        global.answerCallbacks[callbackId] = answerRoleTitle => {
                          const answerRoleTitleId = answerRoleTitle.message_id
                          const title = answerRoleTitle.text
                          const role = {
                            chatId,
                            title,
                            date: fullDate,
                            location
                          }

                          console.log(fullDate.format('DD/MM/YY [às] H[h]mm'))

                          axios
                            .post(`/roles/${chatId}`, role)
                            .then(() => {
                              bot.sendMessage(
                                chatId,
                                `Rolê *${role.title}* marcado para ${role.date.calendar().toLowerCase()} no(a) _${
                                  role.location
                                }_!`,
                                defaultKb(answerRoleTitleId)
                              )
                            })
                            .catch(e => console.error(e))
                        }
                      })
                  }
                })
              } else {
                bot.sendMessage(
                  chatId,
                  `⚠️ *Data inválida*
                    
Escolha uma data futura e preste atenção no formato`,
                  defaultKb(answerRoleTimeId)
                )
              }
            }
          })
      } else {
        bot.sendMessage(chatId, `Use os botões, energúmeno 🙄`, defaultKb(answerRoleDateId))
      }
    }
  })
})

bot.onText(/^\/roles\b/i, async msg => {
  const chatId = msg.chat.id
  const msgId = msg.message_id
  const { data } = await axios.get(`/roles/${chatId}`)
  const roles = data.map(role => ({ ...role, date: moment(role.date) }))

  console.log(roles)

  bot.sendMessage(
    chatId,
    roles.length
      ? `*Próximos Rolês* 🍻
${listRoles(chatId, roles).join('')}`
      : `Nenhum rolê foi marcado ainda 🙁

Envie o comando /role para marcar o próximo!`,
    defaultKb(msgId)
  )
})

bot.onText(/^\/bday\b/i, async msg => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  const msgId = msg.message_id
  const callbackId = `${chatId}:${userId}`
  const userFullName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim()
  const userName = `[${userFullName}](tg://user?id=${userId})`
  const { data } = await axios.get(`/tararaus/${chatId}`)
  const tararaus = data

  console.log(tararaus)

  if (tararaus.filter(tararau => tararau.userId === userId && tararau.chatId === chatId).length) {
    bot.sendMessage(chatId, 'Você já registrou sua data de nascimento ⚠️', defaultKb(msgId))
  } else {
    getBirthdate(callbackId, chatId, userId, msgId, userFullName, userName)
  }
})

bot.onText(/^\/bdays\b/i, async msg => {
  const chatId = msg.chat.id
  const msgId = msg.message_id
  const { data } = await axios.get(`/tararaus/${chatId}`)
  const tararaus = data.map(tararau => ({ ...tararau, birthdate: moment(tararau.birthdate) }))

  console.log(tararaus)

  bot.sendMessage(
    chatId,
    tararaus.length
      ? `*Próximos Aniversariantes* 🎂
${listBirthdays(tararaus).join('')}`
      : `Nenhuma data de nascimento foi registrada ainda 🙁

Envie o comando /bday para registrar a sua!`,
    defaultKb(msgId)
  )
})

bot.onText(/^\/clear\b/i, msg => {
  bot.sendMessage(msg.chat.id, 'Teclado aniquilado com sucesso', defaultKb(msg.message_id))
})

bot.onText(/^\/(help\b|$)/i, msg => {
  bot.sendMessage(
    msg.chat.id,
    `Posso te ajudar a marcar rolês, registrar a data de nascimento da galera e te lembrar dos próximos rolês e aniversariantes.

Você pode fazer isso enviando os seguintes comandos:

/role - marque o rolê com a galera 😎
/roles - veja os próximos rolês do grupo 🍻
/bday - registre sua data de nascimento para o pessoal não deixar seu níver passar em branco 🎉
/bdays - liste os próximos aniversariantes registrados 🎂`,
    defaultKb(msg.message_id)
  )
})

bot.onText(/^\/(?!(role|roles|bday|bdays|clear|help|start|stop)\b).+/i, msg => {
  bot.sendMessage(msg.chat.id, 'Este comando _non ecziste_!', defaultKb(msg.message_id))
})

bot.on('polling_error', err => {
  console.error(err)
})
