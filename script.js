// API endpoints
const CATEGORIES_URL = 'https://www.themealdb.com/api/json/v1/1/categories.php';
const FILTER_BY_CATEGORY_URL = 'https://www.themealdb.com/api/json/v1/1/filter.php?c=';
const SEARCH_BY_NAME_URL = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';
const LIST_INGREDIENTS_URL = 'https://www.themealdb.com/api/json/v1/1/list.php?i=list';
const FILTER_BY_INGREDIENT_URL = 'https://www.themealdb.com/api/json/v1/1/filter.php?i=';
const LOOKUP_MEAL_URL = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

// DOM elements
const categoriesGrid = document.getElementById('categoriesGrid');
const recipesContainer = document.getElementById('recipesContainer');
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const categoriesContainer = document.querySelector('.categories-container');
const ingredientsGrid = document.getElementById('ingredientsGrid');
const selectedFilters = document.getElementById('selectedFilters');
const filtersSection = document.querySelector('.filters-section');

// State management
let selectedIngredient = null;

// Intersection Observer for scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchIngredients();
    observer.observe(filtersSection);
});

// Fetch categories on page load
async function fetchCategories() {
    try {
        const response = await fetch(CATEGORIES_URL);
        const data = await response.json();
        displayCategories(data.categories);
        
        // Observe categories container for scroll animation
        observer.observe(categoriesContainer);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Display categories in the grid
function displayCategories(categories) {
    categoriesGrid.innerHTML = '';
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <img src="${category.strCategoryThumb}" alt="${category.strCategory}">
            <div class="category-info">
                <h3>${category.strCategory}</h3>
                <p>${category.strCategoryDescription}</p>
            </div>
        `;
        categoryCard.addEventListener('click', () => fetchRecipesByCategory(category.strCategory));
        categoriesGrid.appendChild(categoryCard);
    });
}

// Fetch recipes by category
async function fetchRecipesByCategory(categoryName) {
    try {
        const response = await fetch(FILTER_BY_CATEGORY_URL + categoryName);
        const data = await response.json();
        displayRecipes(data.meals, `${categoryName} Recipes`);
        // Scroll after displaying recipes
        setTimeout(() => {
            recipesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}

// Search recipes by name
async function searchRecipes(searchTerm) {
    try {
        recipesContainer.innerHTML = '<div class="loading">Searching recipes...</div>';
        recipesContainer.classList.add('visible');

        const response = await fetch(SEARCH_BY_NAME_URL + searchTerm);
        const data = await response.json();
        if (data.meals) {
            displayRecipes(data.meals, `Search Results for "${searchTerm}"`);
            // Scroll after displaying recipes
            setTimeout(() => {
                recipesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            displayNoResults(searchTerm);
        }
    } catch (error) {
        console.error('Error searching recipes:', error);
        displayNoResults(searchTerm);
    }
}

// Display no results message
function displayNoResults(searchTerm) {
    recipesContainer.innerHTML = `
        <div class="no-results">
            <h2 class="results-title">No recipes found for "${searchTerm}"</h2>
            <p>Try searching for a different ingredient or browse our categories below.</p>
        </div>
    `;
    recipesContainer.classList.add('visible');
    
    // Scroll the no results message into view
    setTimeout(() => {
        recipesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Display recipes in the grid
function displayRecipes(recipes, title = '') {
    recipesContainer.innerHTML = title ? `<h2 class="results-title">${title}</h2>` : '';
    recipesContainer.classList.remove('visible');
    
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        recipeCard.innerHTML = `
            <img src="${recipe.strMealThumb}/medium" alt="${recipe.strMeal}">
            <div class="recipe-info">
                <h3>${recipe.strMeal}</h3>
                <button class="view-recipe-btn" onclick="viewRecipeDetails('${recipe.idMeal}')">View Recipe</button>
            </div>
        `;
        recipesContainer.appendChild(recipeCard);
    });
    
    // Add visible class after a short delay for animation
    setTimeout(() => {
        recipesContainer.classList.add('visible');
        observer.observe(recipesContainer);
    }, 100);
}

// Fetch ingredients
async function fetchIngredients() {
    try {
        const response = await fetch(LIST_INGREDIENTS_URL);
        const data = await response.json();
        displayIngredients(data.meals);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
    }
}

// Display ingredients as checkboxes
function displayIngredients(ingredients) {
    ingredientsGrid.innerHTML = '';
    // Sort ingredients alphabetically
    const sortedIngredients = ingredients
        .filter(ingredient => ingredient.strIngredient) // Remove null/empty ingredients
        .sort((a, b) => a.strIngredient.localeCompare(b.strIngredient));

    sortedIngredients.forEach(ingredient => {
        const div = document.createElement('div');
        div.className = 'ingredient-checkbox';
        div.innerHTML = `
            <input type="radio" name="ingredient" id="${ingredient.idIngredient}" value="${ingredient.strIngredient}">
            <label for="${ingredient.idIngredient}">${ingredient.strIngredient}</label>
        `;
        
        const radio = div.querySelector('input');
        radio.addEventListener('change', () => handleIngredientChange(ingredient.strIngredient, radio.checked));
        
        ingredientsGrid.appendChild(div);
    });
}

// Handle ingredient selection
function handleIngredientChange(ingredient, isChecked) {
    if (isChecked) {
        selectedIngredient = ingredient;
        updateFilterTag(ingredient);
        fetchRecipesByIngredient(ingredient);
    }
}

// Update filter tag
function updateFilterTag(ingredient) {
    selectedFilters.innerHTML = '';
    const tag = document.createElement('div');
    tag.className = 'filter-tag';
    tag.innerHTML = `
        ${ingredient}
        <button onclick="removeIngredient()">&times;</button>
    `;
    selectedFilters.appendChild(tag);
}

// Remove ingredient
function removeIngredient() {
    const radio = document.querySelector(`input[value="${selectedIngredient}"]`);
    if (radio) {
        radio.checked = false;
    }
    selectedIngredient = null;
    selectedFilters.innerHTML = '';
    recipesContainer.innerHTML = '';
}

// Fetch recipes by ingredient
async function fetchRecipesByIngredient(ingredient) {
    try {
        recipesContainer.innerHTML = '<div class="loading">Finding recipes...</div>';
        recipesContainer.classList.add('visible');

        const response = await fetch(FILTER_BY_INGREDIENT_URL + ingredient);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            displayRecipes(data.meals, `Recipes with ${ingredient}`);
            // Scroll after displaying recipes
            setTimeout(() => {
                recipesContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            displayNoResults(ingredient);
        }
    } catch (error) {
        console.error('Error fetching recipes by ingredient:', error);
        displayNoResults(ingredient);
    }
}

// View full recipe details
async function viewRecipeDetails(mealId) {
    try {
        recipesContainer.innerHTML = '<div class="loading">Loading recipe details...</div>';
        
        const response = await fetch(LOOKUP_MEAL_URL + mealId);
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
            displayRecipeDetails(data.meals[0]);
        }
    } catch (error) {
        console.error('Error fetching recipe details:', error);
    }
}

// Display full recipe details
function displayRecipeDetails(recipe) {
    // Get all ingredients and measures
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
            ingredients.push(`${measure} ${ingredient}`);
        }
    }

    recipesContainer.innerHTML = `
        <div class="recipe-details">
            <button class="back-btn" onclick="goBackToRecipes()">← Back to recipes</button>
            <h2 class="results-title">${recipe.strMeal}</h2>
            <div class="recipe-details-content">
                <div class="recipe-image">
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
                    <div class="recipe-category">Category: ${recipe.strCategory}</div>
                    <div class="recipe-area">Cuisine: ${recipe.strArea}</div>
                </div>
                <div class="recipe-ingredients">
                    <h3>Ingredients</h3>
                    <ul>
                        ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
                <div class="recipe-instructions">
                    <h3>Instructions</h3>
                    ${recipe.strInstructions.split('\n').map(step => `<p>${step}</p>`).join('')}
                </div>
            </div>
        </div>
    `;
}

// Function to handle going back to recipes
function goBackToRecipes() {
    if (selectedIngredient) {
        // If we came from ingredient filter, show those recipes again
        fetchRecipesByIngredient(selectedIngredient);
    } else {
        // Otherwise just clear the container
        recipesContainer.innerHTML = '';
    }
}

// Search functionality
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

function handleSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        searchRecipes(searchTerm);
    }
} 