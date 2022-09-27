import {CreateCategoryDto} from "../dto/create-category.dto";

// const categories = [
//     'Comida',
//     'Higiene',
//     'Hogar',
//     'Salidas',
//     'Salud',
// ]

// export const defaultCategories:CreateCategoryDto[] = categories.map(cat => ({
//     name: cat
// }))

export const defaultCategories = [
    {
        name: 'Comida',
        subcategories: ['Carnes', 'Conservados', 'Verduras', 'Frutas']
    },
    {
        name: 'Higiene',
        subcategories: ['Dental', 'Ducha', 'Manos']
    },
    {
        name: 'Hogar',
        subcategories: ['Cocina', 'Living', 'Cochera', 'Dormitorio']
    },
    {
        name: 'Salidas',
        subcategories: ['Boliche', 'Juntada', 'Restaurante']
    },
    {
        name: 'Salud',
        subcategories: ['Hospital', 'Medicamentos',]
    },
]