const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score',
      )
      .where('language.user_id', user_id)
      .first()
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count',
      )
      .where({ language_id })
  },

  getWordWithId(db, id) {
    return db
      .from('word')
      .select('*')
      .where('word.id', id)
      .first() 
  },

  updateWord(db, id, newFields) {
    return db
      .where({ id })
      .update(newFields)
  },

  updateLanguage(db, id, newFields) {
    return db
      .where({ id })
      .update(newFields)
  },
}

module.exports = LanguageService
