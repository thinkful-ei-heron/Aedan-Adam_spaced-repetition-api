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
        totalScore: req.language.total_score,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .post('/guess', jsonParser, async (req, res, next) => {
    // validate req exists
    if (!req.body.guess) {
      return res.status(400).json({
        error: `Missing 'guess' in request body`
      })
    }
    try {
      let db = req.app.get('db')
      let success = false
      //get current head of language list by id and set to currHead
      const currHead = await LanguageService.getWordWithId(
        db,
        req.language.head
      )

      let guess = req.body.guess.toLowerCase()
      let newTotal = req.language.total_score
      let newMemoryValue = currHead.memory_value * 2
      //compare request guess to current head, if correct increase total, else set memory value to 1
      if (guess === currHead.translation.toLowerCase()) {
        success = true
        newTotal++
      } else {
        newMemoryValue = 1
      }
      //update language to set the new total(different only if correct) and set the new head to the next node
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
      //use counter and while loop to find the last word in the list with memory value less than the current words memory value
      while (counter !== newMemoryValue) {
        if (currNode.next !== null) {
          currNode = await LanguageService.getWordWithId(
            db,
            currNode.next,
          )
          counter++
        } else break;
      }
      //set tempNext to currNode.next to use when updating the current head
      let tempNext = currNode.next
      updatePrevNode = {
        next: currHead.id,
      }
      //update the word found in the while loop at 107 to have its next pointing to the current head, this moves the current head to that position in the list
      await LanguageService.updateWord(
        db,
        currNode.id,
        updatePrevNode,
      )
      let wordCounter = success ? 'correct_count' : 'incorrect_count'
      //update the current head to it's new memory value and set it's next pointer to tempNext, completing the move of the current head
      let wordToUpdate = {
        [wordCounter]: currHead[wordCounter] + 1,
        memory_value: newMemoryValue,
        next: tempNext
      }
      let updatedWord = await LanguageService.updateWord(
        db,
        currHead.id,
        wordToUpdate,
      )
      //grab the next word in the list and send to client to begin the guessing process over again
      let nextWord = await LanguageService.getWordWithId(db, currHead.next);
      return res.json({
        nextWord: nextWord.original,
        wordCorrectCount: nextWord.correct_count,
        wordIncorrectCount: nextWord.incorrect_count,
        totalScore: newTotal,
        answer: updatedWord.translation,
        isCorrect: success,
      })

    }
    catch (error) {
      next(error)
    }
  })

module.exports = languageRouter
