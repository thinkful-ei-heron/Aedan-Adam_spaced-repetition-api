const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonParser = express.json()

const languageRouter = express.Router()

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      )

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        })

      req.language = language
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )
      res.json({
        language: req.language,
        words,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/head', async (req, res, next) => {
    try {
      const head = await LanguageService.getWordWithId(
        req.app.get('db'),
        req.language.head
      )
      res.json({
        nextWord: head.original,
        wordCorrectCount: head.correct_count,
        wordIncorrectCount: head.incorrect_count,
        total_score: language.total_score,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .post('/guess', jsonParser, async (req, res, next) => {
    try {
      let db = req.app.get('db')
      let success = false
      const currHead = await LanguageService.getWordWithId(
        db,
        req.language.head
      )
      let guess = req.body.toLowerCase()
      let newTotal = req.language.total_score
      let newMemoryValue = currHead.memory_value * 2
      if (guess === currHead.translation.toLowerCase()) {
        success = true
        newTotal++

      } else {
        newMemoryValue = 1
      }

      let updateLanguage = {
        head: currHead.next,
        total_score: newTotal,
      }
      await LanguageService.updateLanguage(
        db,
        req.language.id,
        updateLanguage,
      )

      let counter = 0
      let currNode = currHead
      let prevNode = null
      while (counter !== newMemoryValue) {
        if (currNode.next !== null) {
          prevNode = currNode
          currNode = await LanguageService.getWordWithId(
            db,
            currNode.next,
          )
        } else {
          prevNode = currNode
          currNode = null
          break;
        }
        counter++
      }
      let tempNext = currNode.next
      updatePrevNode = {
        next: currHead.id,
      }
      await LanguageService.updateWord(
        db,
        currNode.id,
        updatePrevNode,
      )
      let wordCounter = success ? 'correct_count' : 'incorrect_count'
      let wordToUpdate = {
        [wordCounter]: currHead[wordCounter] + 1,
        memory_value: newMemoryValue,
        next: tempNext
      }
      await LanguageService.updateWord(
        db,
        currHead.id,
        wordToUpdate,
      )
      res.json({correctAnswer: currHead.translation, success })
    }
    catch (error){
      next(error)
    }
  })

module.exports = languageRouter
