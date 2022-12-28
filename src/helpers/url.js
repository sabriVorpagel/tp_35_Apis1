const urlBase  = (req) =>{
    return `${req.protocol}://${req.get('host')}`

}
const url  = (req) =>{
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`

}

module.exports = {
    urlBase,
    url
}