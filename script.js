// আপনার TMDB API Key এখানে দিন
const API_KEY = 'ed9b950d5a090fa670ad6493734cd080';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Trending মুভিগুলো পাওয়ার জন্য ফাংশন
async function getTrendingMovies() {
    const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
    const data = await response.json();
    displayMovies('trending-movies', data.results);
}

// মুভিগুলো ওয়েবসাইটে দেখানোর জন্য ফাংশন
function displayMovies(elementId, movies) {
    const container = document.getElementById(elementId);
    container.innerHTML = ''; // আগের ডেটা মুছে ফেলি

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        
        // প্রতিটি কার্ডে মুভির পোস্টার, টাইটেল ইত্যাদি যোগ করা হচ্ছে
        movieCard.innerHTML = `
            <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}">
            <div class="movie-title">${movie.title} (${movie.release_date.split('-')[0]})</div>
            <div class="movie-info">Rating: ${movie.vote_average.toFixed(1)}</div>
        `;
        
        container.appendChild(movieCard);
    });
}

// পেজ লোড হলে ফাংশনগুলো কল করা
document.addEventListener('DOMContentLoaded', () => {
    getTrendingMovies();
    // একইভাবে আপনি 'Latest Movies' এর জন্য অন্য একটি API endpoint ব্যবহার করতে পারেন
});
