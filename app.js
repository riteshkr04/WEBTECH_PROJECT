const FitTrackApp = {
    data: {
        wellness: {
            steps: 7234,
            stepsGoal: 10000,
            calories: 1850,
            caloriesGoal: 2500,
            water: 6,
            waterGoal: 8
        },
        activities: [
            { id: 1, name: 'Morning Run', duration: 30, calories: 300, time: 'morning', timestamp: Date.now() },
            { id: 2, name: 'Yoga Session', duration: 45, calories: 150, time: 'morning', timestamp: Date.now() },
            { id: 3, name: 'Cycling', duration: 60, calories: 500, time: 'afternoon', timestamp: Date.now() },
            { id: 4, name: 'Swimming', duration: 40, calories: 400, time: 'evening', timestamp: Date.now() }
        ],
        meals: {
            breakfast: [
                { id: 1, name: 'Oatmeal with Berries', calories: 320 },
                { id: 2, name: 'Greek Yogurt', calories: 150 }
            ],
            lunch: [
                { id: 3, name: 'Grilled Chicken Salad', calories: 450 },
                { id: 4, name: 'Quinoa Bowl', calories: 380 }
            ],
            dinner: [
                { id: 5, name: 'Salmon with Vegetables', calories: 520 },
                { id: 6, name: 'Brown Rice', calories: 210 }
            ]
        },
        weeklyActivity: {
            'Mon': 45,
            'Tue': 60,
            'Wed': 30,
            'Thu': 75,
            'Fri': 50,
            'Sat': 90,
            'Sun': 40
        },
        weeklyCalories: {
            'Mon': 450,
            'Tue': 600,
            'Wed': 300,
            'Thu': 750,
            'Fri': 500,
            'Sat': 900,
            'Sun': 400
        }
    },

    currentFilter: 'all',
    currentMealType: '',
    nextActivityId: 5,
    nextMealId: 7,

    init() {
        this.loadFromStorage();
        this.setupNavigation();
        this.setupLiveClock();
        this.renderWellness();
        this.renderActivities();
        this.renderMeals();
        this.renderInsights();
        this.setupEventListeners();
    },

    loadFromStorage() {
        const stored = localStorage.getItem('fitTrackData');
        if (stored) {
            const parsedData = JSON.parse(stored);
            this.data = { ...this.data, ...parsedData };
            this.nextActivityId = Math.max(...this.data.activities.map(a => a.id), 0) + 1;
            this.nextMealId = Math.max(
                ...Object.values(this.data.meals).flat().map(m => m.id), 
                0
            ) + 1;
        }
    },

    saveToStorage() {
        localStorage.setItem('fitTrackData', JSON.stringify(this.data));
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.page');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = item.getAttribute('data-page');
                
                navItems.forEach(nav => nav.classList.remove('active'));
                pages.forEach(page => page.classList.remove('active'));
                
                item.classList.add('active');
                document.getElementById(`${targetPage}-page`).classList.add('active');
            });
        });
    },

    setupLiveClock() {
        const updateClock = () => {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            document.getElementById('liveClock').textContent = now.toLocaleDateString('en-US', options);
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    },

    renderWellness() {
        const { steps, stepsGoal, calories, caloriesGoal, water, waterGoal } = this.data.wellness;
        
        this.animateProgress('steps', steps, stepsGoal, '#667eea');
        this.animateProgress('calories', calories, caloriesGoal, '#f5576c');
        this.animateProgress('water', water, waterGoal, '#00f2fe');
    },

    animateProgress(type, value, goal, color) {
        const percentage = Math.min((value / goal) * 100, 100);
        const circle = document.getElementById(`${type}Circle`);
        const valueEl = document.getElementById(`${type}Value`);
        const radius = 85;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        circle.style.stroke = color;
        circle.style.strokeDasharray = circumference;
        
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 100);

        this.animateCounter(valueEl, 0, value, 1500);
    },

    animateCounter(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                element.textContent = Math.round(end);
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, 16);
    },

    setupEventListeners() {
        document.getElementById('addActivityBtn').addEventListener('click', () => {
            this.openModal('activityModal');
        });

        document.getElementById('closeActivityModal').addEventListener('click', () => {
            this.closeModal('activityModal');
        });

        document.getElementById('activityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addActivity();
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.renderActivities();
            });
        });

        document.querySelectorAll('.btn-add-meal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentMealType = e.target.getAttribute('data-meal-type');
                document.getElementById('mealType').value = this.currentMealType;
                this.openModal('mealModal');
            });
        });

        document.getElementById('closeMealModal').addEventListener('click', () => {
            this.closeModal('mealModal');
        });

        document.getElementById('mealForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMeal();
        });

        document.getElementById('closeSuccessModal').addEventListener('click', () => {
            this.closeModal('successModal');
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadSummary();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all dashboard data? This action cannot be undone.')) {
                this.resetDashboard();
            }
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    renderActivities() {
        const container = document.getElementById('activitiesList');
        const filtered = this.currentFilter === 'all' 
            ? this.data.activities 
            : this.data.activities.filter(a => a.time === this.currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--color-text-muted); padding: 2rem;">No activities found</p>';
            return;
        }

        container.innerHTML = filtered.map(activity => `
            <div class="activity-item">
                <div class="activity-info">
                    <h4>${activity.name}</h4>
                    <div class="activity-meta">
                        <span>⏱️ ${activity.duration} mins</span>
                        <span>🔥 ${activity.calories} cal</span>
                        <span class="activity-badge badge-${activity.time}">${activity.time}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addActivity() {
        const name = document.getElementById('activityName').value.trim();
        const duration = parseInt(document.getElementById('activityDuration').value);
        const calories = parseInt(document.getElementById('activityCalories').value);
        const time = document.getElementById('activityTime').value;

        if (!name || !duration || !calories || !time) {
            alert('Please fill in all fields');
            return;
        }

        const newActivity = {
            id: this.nextActivityId++,
            name,
            duration,
            calories,
            time,
            timestamp: Date.now()
        };

        this.data.activities.unshift(newActivity);
        this.saveToStorage();
        this.renderActivities();
        
        document.getElementById('activityForm').reset();
        this.closeModal('activityModal');
        this.showSuccess('Activity Added Successfully!');
    },

    renderMeals() {
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
            const container = document.getElementById(`${mealType}Items`);
            const meals = this.data.meals[mealType];

            if (meals.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--color-text-muted); padding: 1rem;">No meals added</p>';
            } else {
                container.innerHTML = meals.map(meal => `
                    <div class="meal-item">
                        <div class="meal-item-info">
                            <h4>${meal.name}</h4>
                            <p class="meal-calories">${meal.calories} calories</p>
                        </div>
                        <button class="remove-meal" onclick="FitTrackApp.removeMeal('${mealType}', ${meal.id})">×</button>
                    </div>
                `).join('');
            }
        });

        this.updateTotalCalories();
    },

    addMeal() {
        const name = document.getElementById('mealName').value.trim();
        const calories = parseInt(document.getElementById('mealCalories').value);
        const mealType = document.getElementById('mealType').value;

        if (!name || !calories) {
            alert('Please fill in all fields');
            return;
        }

        const newMeal = {
            id: this.nextMealId++,
            name,
            calories
        };

        this.data.meals[mealType].push(newMeal);
        this.saveToStorage();
        this.renderMeals();
        
        document.getElementById('mealForm').reset();
        this.closeModal('mealModal');
        this.showSuccess('Meal Added Successfully!');
    },

    removeMeal(mealType, mealId) {
        this.data.meals[mealType] = this.data.meals[mealType].filter(m => m.id !== mealId);
        this.saveToStorage();
        this.renderMeals();
    },

    updateTotalCalories() {
        const total = Object.values(this.data.meals)
            .flat()
            .reduce((sum, meal) => sum + meal.calories, 0);
        document.getElementById('totalCalories').textContent = total;
    },

    renderInsights() {
        this.renderBarChart('activityChart', this.data.weeklyActivity, 'Activity Minutes', 120);
        this.renderBarChart('caloriesChart', this.data.weeklyCalories, 'Calories Burned', 1000);
    },

    renderBarChart(containerId, data, label, maxValue) {
        const container = document.getElementById(containerId);
        const max = Math.max(...Object.values(data), maxValue);

        container.innerHTML = Object.entries(data).map(([day, value]) => {
            const height = (value / max) * 100;
            return `
                <div class="bar" style="height: ${height}%">
                    <span class="bar-value">${value}</span>
                    <span class="bar-label">${day}</span>
                </div>
            `;
        }).join('');
    },

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    showSuccess(message) {
        document.getElementById('successMessage').textContent = message;
        this.openModal('successModal');
        setTimeout(() => {
            this.closeModal('successModal');
        }, 2000);
    },

    downloadSummary() {
        const summary = {
            date: new Date().toLocaleDateString(),
            wellness: this.data.wellness,
            totalActivities: this.data.activities.length,
            totalMeals: Object.values(this.data.meals).flat().length,
            weeklyStats: {
                activity: this.data.weeklyActivity,
                calories: this.data.weeklyCalories
            }
        };

        const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fittrack-summary-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showSuccess('Summary Downloaded Successfully!');
    },

    resetDashboard() {
        localStorage.removeItem('fitTrackData');
        sessionStorage.clear();
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    FitTrackApp.init();
});
