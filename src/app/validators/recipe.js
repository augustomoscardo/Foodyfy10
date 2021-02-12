const Recipe = require('../models/Recipe')


function checkAllFields(body) {
    const keys = Object.keys(body)

    for (key of keys) {
        if (body[key] == "") {
            return {
                user: body,
                error: 'Por favor, preencha todos os campos'
            }
        }
    }
}

async function post(req, res, next) {
    try {
        let results = await Recipe.chefsSelectOptions()
        const chefOptions = results.rows 

        const keys = Object.keys(req.body)

        for (key of keys) {
            if (req.body[key] == "") {
                return res.render('admin/recipes/create', {
                    recipe: req.body,
                    chefOptions,
                    error: 'Por favor, preencha todos os campos'
                })
            }
        }

        if (!req.files || req.files.length == 0) 
            return res.render('admin/recipes/create', {
                recipe: req.body,
                chefOptions,
                error: "Por favor envie pelo menos uma imagem."
            })

        next()
    } catch (error) {
        console.error(error);
    }
}


module.exports = {
    post
}