export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_SORT_BY = 'created_at'
export const DEFAULT_SORT_ORDER = 'desc'

/**
 * Regex pour valider les notes de fournisseurs.
 * Autorise : lettres, chiffres, espaces, ponctuation courante, newlines
 * Interdit : caractères dangereux (<, >, &, etc.) pour protection XSS
 */
export const NOTES_REGEX = /^[a-zA-Z0-9\s\.,;:!?\-()'"\/\n\r@#%&*+=_\[\]{}]*$/
export const NOTES_MAX_LENGTH = 10000
