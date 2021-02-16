const Chef = require('../models/Chef')
const File = require('../models/File')
const RecipeFile = require('../models/RecipeFile')

module.exports = {
    async index(req, res) {

        try {
            let results = await Chef.all()
            const chefs = results.rows


            const chefWithImage = await Promise.all(chefs.map( async chef => {
                const fileResults = await Chef.find(chef.id) // trazendo os chefs
                const fileId = fileResults.rows[0].file_id // pegando o id da imagem dentro de chef
                
                const imageResults = await File.find(fileId) // trazendo as imagens 
                const image = imageResults.rows[0].path // acessando a propriedade path das imagens

                return {
                    ...chef,
                    image: `${req.protocol}://${req.headers.host}${image.replace("public", "")}`
                }
            }))
            return res.render('admin/chefs/index', { chefs: chefWithImage })

        } catch (error) {
            console.log(error)
        }

    },
    create(req, res) {
    
        return res.render('admin/chefs/create')
    },
    async post(req, res) {

        try {
            // Criar a imagem primeiro, pois quando eu crio o chef é nele que eu pego a imagem.
            const filesPromise = req.files.map(file => File.create(file))
            
            let results = await Promise.all(filesPromise)

            const fileId = results[0].rows[0].id

            results = await Chef.create({
               name: req.body.name,
               file_id: fileId
            })

            const chefId = results.rows[0].id
            
            return res.redirect(`/admin/chefs/${chefId}`)

        } catch (error) {
            console.log(error)
        }
    },
    async show(req, res) {

        try {
            // get chef
            let results = await Chef.find(req.params.id)

            const chef = results.rows[0]

            if (!chef) return res.send('Chef not found!')
            
            // get image of chef
            results = await File.find(chef.file_id)
            const files = results.rows.map(file => ({
                ...file,
                src: `${req.protocol}://${req.headers.host}${file.path.replace("public", "")}`
            }))
            
            // get recipes of chef
            results = await Chef.findChefRecipes(chef.id)
            const chefRecipes = results.rows

            // get image of recipe
            const chefRecipesWithImage = await Promise.all(chefRecipes.map(async recipe => {
                const fileResults = await RecipeFile.findRecipeId(recipe.id)  // id 31
                const fileId = fileResults.rows[0].file_id // 92

                const imageResults = await File.find(fileId)  // pega oq tem no file(name, path)
                const image = imageResults.rows[0].path  // acessando o path

                return { // no map eu preciso de um return, no caso retorno uma nova propriedade para recipe
                    ...recipe,
                    image: `${req.protocol}://${req.headers.host}${image.replace("public", "")}`
                }
            }))
            
            return res.render("admin/chefs/show", { chef, files, chefRecipes: chefRecipesWithImage })

        } catch (error) {
            console.log(error)
        }
    },
    async edit(req, res) {

        try {
            let results = await Chef.find(req.params.id)

            const chef = results.rows[0]

            if (!chef) return res.send('Chef not found!')

            // get images
            results = await Chef.files(chef.file_id)
            let files = results.rows
            files = files.map(file => ({
                ...file,
                src: `${req.protocol}://${req.headers.host}${file.path.replace("public", "")}`
            }))

            return res.render("admin/chefs/edit", { chef, files })

        } catch (error) {
            console.log(error)
            
        }
    },
    async put(req, res) {

        try {
            // const keys = Object.keys(req.body)

            // for (key of keys) {
            //     if (req.body[key] == "" && key != "removed_files") {
            //         return res.send('Please fill all fields!')
            //     }
            // }

            let newFiles;

            // get new image
            if (req.files.length != 0) {
                const newFilesPromise = req.files.map(file => File.create(file))

               newFiles = await Promise.all(newFilesPromise)
               console.log(newFiles)
            }

            // remove photo from db
            if (req.body.removed_files) {
                // 1,
                const removedFiles = req.body.removed_files.split(",") // [1,]

                const lastIndex = removedFiles.length - 1

                removedFiles.splice(lastIndex, 1) // [1]

                console.log(removedFiles);

                const removedFilesPromise = removedFiles.map(id => File.delete(id))

                await Promise.all(removedFilesPromise)
            }

            console.log({
                name: req.body.name,
                file_id: newFiles[0].rows[0].id,
                id: req.body.id
            })

            await Chef.update({
                name: req.body.name,
                file_id: newFiles[0].rows[0].id,
                id: req.body.id
            })

            return res.redirect(`/admin/chefs/${req.body.id}`)

        } catch (error) {
            console.error(error);          
        }
    },
    async delete(req, res) {

        try {
            // finding chef
            const chefResults = await Chef.find(req.body.id)

            const chef = chefResults.rows[0]

            // can't delete if chef has recipes registered
            if (chef.total_recipes >= 1) {
                
                return res.send('Chefs que possuem receitas não podem ser deletados')
            } else {
                
                await Chef.delete(req.body.id)

                //await File.delete(chef.file_id) // não tem mais uso, o File.delete está resolvido na query do Chef.delete!!

                return res.redirect(`/admin/chefs`)
            }
        } catch (error) {
            console.error(error)   
        }
    },
}