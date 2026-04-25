const API_URL = 'http://localhost:5000/api';

// State
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let savedRecipes = []; // Array of saved recipe IDs

// DOM Elements
const sections = document.querySelectorAll('.page-section');
const navLinks = document.querySelectorAll('.nav-links a');
const authOnlyElements = document.querySelectorAll('.auth-only');
const guestOnlyElements = document.querySelectorAll('.guest-only');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    if (currentUser) {
        fetchSavedRecipes();
    }
    navigateTo('homeSection');
    setupEventListeners();
    fetchRecipes();
});

// Navigation
function navigateTo(sectionId) {
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    navLinks.forEach(link => {
        if(link.id === 'nav' + sectionId.replace('Section', '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Special logic per section
    if (sectionId === 'homeSection') fetchRecipes();
    if (sectionId === 'dashboardSection') loadDashboard();
}

function updateNav() {
    if (currentUser) {
        authOnlyElements.forEach(el => el.style.display = 'block');
        guestOnlyElements.forEach(el => el.style.display = 'none');
        document.getElementById('userNameDisplay').textContent = currentUser.username;
    } else {
        authOnlyElements.forEach(el => el.style.display = 'none');
        guestOnlyElements.forEach(el => el.style.display = 'block');
    }
}

// Event Listeners
function setupEventListeners() {
    // Nav Links
    document.getElementById('navHome').addEventListener('click', (e) => { e.preventDefault(); navigateTo('homeSection'); });
    document.getElementById('navDashboard').addEventListener('click', (e) => { e.preventDefault(); navigateTo('dashboardSection'); });
    document.getElementById('navCreateRecipe').addEventListener('click', (e) => { e.preventDefault(); navigateTo('createRecipeSection'); });
    document.getElementById('navLogin').addEventListener('click', (e) => { e.preventDefault(); navigateTo('loginSection'); });
    document.getElementById('navRegister').addEventListener('click', (e) => { e.preventDefault(); navigateTo('registerSection'); });
    document.getElementById('navLogout').addEventListener('click', (e) => { 
        e.preventDefault(); 
        logout(); 
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('createRecipeForm').addEventListener('submit', handleCreateRecipe);

    // Links between forms
    document.getElementById('linkToRegister').addEventListener('click', (e) => { e.preventDefault(); navigateTo('registerSection'); });
    document.getElementById('linkToLogin').addEventListener('click', (e) => { e.preventDefault(); navigateTo('loginSection'); });

    // Dashboard Tabs
    document.getElementById('tabMyRecipes').addEventListener('click', () => {
        document.getElementById('tabMyRecipes').classList.add('active');
        document.getElementById('tabSavedRecipes').classList.remove('active');
        loadDashboardRecipes('my');
    });
    document.getElementById('tabSavedRecipes').addEventListener('click', () => {
        document.getElementById('tabSavedRecipes').classList.add('active');
        document.getElementById('tabMyRecipes').classList.remove('active');
        loadDashboardRecipes('saved');
    });

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('recipeModal').classList.remove('show');
    });
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        console.log('[Frontend] Login Response:', data);
        
        if (res.ok) {
            login(data);
            showToast('Logged in successfully', 'success');
            document.getElementById('loginForm').reset();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        console.log('[Frontend] Register Response:', data);
        
        if (res.ok) {
            login(data);
            showToast('Registered successfully', 'success');
            document.getElementById('registerForm').reset();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
    }
}

function login(user) {
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    updateNav();
    fetchSavedRecipes();
    navigateTo('homeSection');
}

function logout() {
    currentUser = null;
    savedRecipes = [];
    localStorage.removeItem('user');
    updateNav();
    navigateTo('loginSection');
    showToast('Logged out', 'success');
}

// Helper for Auth headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
    };
}

// Recipes API
async function fetchRecipes() {
    try {
        console.log('[Frontend] Fetching recipes from:', `${API_URL}/recipes`);
        const res = await fetch(`${API_URL}/recipes`);
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}`);
        }
        const recipes = await res.json();
        console.log('[Frontend] Recipes fetched:', recipes);
        renderRecipes(recipes, 'recipesList');
    } catch (error) {
        console.error('[Frontend] Failed to load recipes:', error);
        document.getElementById('recipesList').innerHTML = '<p class="empty-state">Failed to load recipes. Please ensure backend is running.</p>';
    }
}

async function handleCreateRecipe(e) {
    e.preventDefault();
    if (!currentUser) return;

    const newRecipe = {
        title: document.getElementById('recipeTitle').value,
        description: document.getElementById('recipeDescription').value,
        imageUrl: document.getElementById('recipeImageUrl').value,
        prepTime: document.getElementById('recipePrepTime').value,
        ingredients: document.getElementById('recipeIngredients').value.split(',').map(i => i.trim()),
        instructions: document.getElementById('recipeInstructions').value
    };

    try {
        const res = await fetch(`${API_URL}/recipes`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newRecipe)
        });
        
        if (res.ok) {
            showToast('Recipe published!', 'success');
            document.getElementById('createRecipeForm').reset();
            navigateTo('dashboardSection');
        } else {
            const data = await res.json();
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to create recipe', 'error');
    }
}

async function deleteRecipe(id, containerId) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
        const res = await fetch(`${API_URL}/recipes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (res.ok) {
            showToast('Recipe deleted', 'success');
            // If modal is open, close it
            document.getElementById('recipeModal').classList.remove('show');
            // Refresh list based on context
            if (containerId === 'recipesList' || document.getElementById('homeSection').classList.contains('active')) {
                fetchRecipes();
            } else {
                loadDashboardRecipes('my');
            }
        } else {
            showToast('Failed to delete recipe', 'error');
        }
    } catch (error) {
        showToast('Error connecting to server', 'error');
    }
}

// Save/Unsave Recipes
async function fetchSavedRecipes() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/users/saved-recipes`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            savedRecipes = data.map(r => r._id || r); 
        }
    } catch (error) {
        console.error('Failed to fetch saved recipes');
    }
}

async function toggleSaveRecipe(id) {
    if (!currentUser) {
        showToast('Please login to save recipes', 'error');
        navigateTo('loginSection');
        return;
    }

    const isSaved = savedRecipes.includes(id);
    const method = isSaved ? 'unsave-recipe' : 'save-recipe';

    try {
        const res = await fetch(`${API_URL}/users/${method}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (res.ok) {
            const data = await res.json();
            savedRecipes = data.savedRecipes;
            
            // Toggle icon visual
            const btn = document.querySelector(`button[data-id="${id}"].save-btn`);
            if(btn) {
                btn.innerHTML = savedRecipes.includes(id) ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
                btn.classList.toggle('active', savedRecipes.includes(id));
            }
            
            showToast(isSaved ? 'Removed from saved' : 'Recipe saved', 'success');
        }
    } catch (error) {
        showToast('Action failed', 'error');
    }
}

// Dashboard Logic
async function loadDashboard() {
    document.getElementById('tabMyRecipes').classList.add('active');
    document.getElementById('tabSavedRecipes').classList.remove('active');
    loadDashboardRecipes('my');
}

async function loadDashboardRecipes(type) {
    const container = document.getElementById('dashboardRecipesList');
    container.innerHTML = '<p class="empty-state">Loading...</p>';
    
    try {
        if (type === 'my') {
            const res = await fetch(`${API_URL}/recipes`);
            const allRecipes = await res.json();
            const myRecipes = allRecipes.filter(r => r.author && r.author._id === currentUser._id);
            renderRecipes(myRecipes, 'dashboardRecipesList', true);
        } else if (type === 'saved') {
            const res = await fetch(`${API_URL}/users/saved-recipes`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            renderRecipes(data, 'dashboardRecipesList');
        }
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Error loading recipes.</p>';
    }
}

// Render Logic
function renderRecipes(recipes, containerId, isMyRecipes = false) {
    const container = document.getElementById(containerId);
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = '<p class="empty-state">No recipes yet.</p>';
        return;
    }

    container.innerHTML = recipes.map(recipe => {
        const isSaved = savedRecipes.includes(recipe._id);
        const heartClass = isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const activeClass = isSaved ? 'active' : '';
        
        const isAuthor = currentUser && recipe.author && (recipe.author._id === currentUser._id || recipe.author === currentUser._id);
        
        let actionButtons = `<button class="btn-icon save-btn ${activeClass}" data-id="${recipe._id}" onclick="toggleSaveRecipe('${recipe._id}')" title="Save Recipe"><i class="${heartClass}"></i></button>`;
        
        if (isMyRecipes || isAuthor) {
            actionButtons += `<button class="btn-icon" onclick="deleteRecipe('${recipe._id}', '${containerId}')" title="Delete Recipe"><i class="fa-solid fa-trash"></i></button>`;
        }

        return `
            <div class="recipe-card">
                <img src="${recipe.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${recipe.title}" class="recipe-img" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Invalid+Image';">
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-desc">${recipe.description}</p>
                    <div class="recipe-meta">
                        <span><i class="fa-regular fa-clock"></i> ${recipe.prepTime || '-'} mins</span>
                        <span><i class="fa-solid fa-user"></i> ${recipe.author ? recipe.author.username : 'Unknown'}</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="btn btn-outline w-100" onclick="viewRecipe('${recipe._id}')">View Recipe</button>
                        ${currentUser ? actionButtons : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function viewRecipe(id) {
    try {
        const res = await fetch(`${API_URL}/recipes/${id}`);
        const recipe = await res.json();
        
        const modalBody = document.getElementById('modalBody');
        
        const isSaved = savedRecipes.includes(recipe._id);
        const heartClass = isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const isAuthor = currentUser && recipe.author && (recipe.author._id === currentUser._id || recipe.author === currentUser._id);

        modalBody.innerHTML = `
            <div class="modal-recipe-header">
                <h2>${recipe.title}</h2>
            </div>
            <img src="${recipe.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}" class="modal-recipe-img" alt="${recipe.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Invalid+Image';">
            
            <div class="modal-recipe-meta">
                <span><i class="fa-regular fa-clock"></i> ${recipe.prepTime || '-'} mins</span>
                <span><i class="fa-solid fa-user"></i> ${recipe.author ? recipe.author.username : 'Unknown'}</span>
                ${currentUser ? `<button class="btn-icon save-btn ${isSaved?'active':''}" data-id="${recipe._id}" onclick="toggleSaveRecipe('${recipe._id}')" style="margin-left:auto"><i class="${heartClass}"></i> Save</button>` : ''}
                ${isAuthor ? `<button class="btn-icon" onclick="deleteRecipe('${recipe._id}', 'recipesList')" title="Delete Recipe" style="color:var(--danger); margin-left: 10px;"><i class="fa-solid fa-trash"></i> Delete</button>` : ''}
            </div>

            <div class="modal-recipe-section">
                <h3>Description</h3>
                <p>${recipe.description}</p>
            </div>

            <div class="modal-recipe-section">
                <h3>Ingredients</h3>
                <ul>
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>

            <div class="modal-recipe-section">
                <h3>Instructions</h3>
                <p style="white-space: pre-wrap;">${recipe.instructions}</p>
            </div>
        `;
        
        document.getElementById('recipeModal').classList.add('show');
    } catch (error) {
        showToast('Error loading recipe details', 'error');
    }
}

// Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if(type === 'success') icon = 'fa-check-circle';
    if(type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
