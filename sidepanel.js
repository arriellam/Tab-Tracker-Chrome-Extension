// Opens the side panel when the extension icon is clicked
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));


// function to get all open tabs and dynamically generate html so that
// they display as a list)
document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the search input element
    const searchInput = document.getElementById('searchSessions');
    // Store checkbox states for each tab
    const checkboxStates = {}; 
    // Store last active times for each tab
    const lastActiveTimes = {}; // Time threshold in minutes
    const timeThresholdKey = 'timeThreshold';
    const timeUnitKey = 'timeUnit';
    

    // Function to filter tabs based on search input
    function filterTabs(searchText) {
        const tabs = document.querySelectorAll('.session');
        tabs.forEach(tab => {
            const tabTitle = tab.querySelector('.session-name').textContent.toLowerCase();
            const tabUrl = tab.querySelector('.tab-url').textContent.toLowerCase();
            if (tabTitle.includes(searchText) || tabUrl.includes(searchText)) {
                tab.style.display = ''; // Show tab if it matches search text
            } else {
                tab.style.display = 'none'; // Hide tab if it doesn't match search text
            }
        });
    }

    // Event listener for input event on the search input
    searchInput.addEventListener('input', function() {
        const searchText = searchInput.value.toLowerCase();
        filterTabs(searchText);
    });
    
    function updateTabList() {
        // maintain checkbox states
        getCheck();
        const listElement = document.getElementById('tabsList');
        chrome.tabs.query({}, function(tabs) {
            listElement.innerHTML = ''; // Clear existing list items

            // Group tabs by windowId
            const windows = tabs.reduce((acc, tab) => {
                acc[tab.windowId] = acc[tab.windowId] || [];
                acc[tab.windowId].push(tab);
                return acc;
            }, {});

            // Counter for window numbering
            let windowCount = 1;

            // Create UI elements for each window and its tabs
            Object.keys(windows).forEach(windowId => {
                const windowDiv = document.createElement('div');
                windowDiv.className = 'window-group';
                const windowTitle = document.createElement('h2');
                windowTitle.textContent = `Window ${windowCount++}`; // Sequential numbering instead of windowId
                windowDiv.appendChild(windowTitle);
                
                windows[windowId].forEach(tab => {
                    const li = document.createElement('li');
                    li.className = 'session';
                   
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'session-info';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'tab-select';
                    checkbox.checked = checkboxStates[tab.id] || false;
                    infoDiv.appendChild(checkbox);

                    const span = document.createElement('span');
                    span.className = 'session-name';
                    span.textContent = tab.title || 'No Title';
                    span.href = tab.url;
                    span.addEventListener('click', function(event) {
                        event.preventDefault();
                        chrome.tabs.update(tab.id, {active: true});
                        chrome.windows.update(tab.windowId, {focused: true});
                    });
                    infoDiv.appendChild(span);

                    const idSpan = document.createElement('span');
                    idSpan.className = 'tab-id';
                    idSpan.textContent = tab.id;
                    idSpan.style.display = 'none';
                    infoDiv.appendChild(idSpan);

                    const tabURL = document.createElement('a');
                    tabURL.className = 'tab-url';
                    infoDiv.appendChild(tabURL);

                    // updated color based on time threshold
                    const minutesSinceLastAccess = calculateTimeDifference(tab);
                    if (minutesSinceLastAccess < calculateThreshold()) {
                        li.style.backgroundColor = 'lightgreen' 
                    } else {
                        li.style.backgroundColor = 'lightcoral';
                    }

                    li.appendChild(infoDiv);

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'session-actions';
                    li.appendChild(actionsDiv);

                    windowDiv.appendChild(li);
                });

                listElement.appendChild(windowDiv);
            });
            filterTabs(searchInput.value.toLowerCase());
        });
    }
    
    // Function to calculate time difference between current time and last accessed time
    function calculateTimeDifference(tab) {
        const tabId = tab.id;
        const currentTime = new Date();
        if (tab.active) {
            lastActiveTimes[tabId] = currentTime;
        }
        // If no last active time recorded, use lassed accessed time
        const lastActiveTime = lastActiveTimes[tabId] || new Date(tab.lastAccessed);
        const timeDiff = currentTime.getTime() - lastActiveTime.getTime();
        return Math.floor(timeDiff);
    }

    function getCheck() {
        const listElement = document.getElementById('tabsList');
        // Loop through existing checkboxes to store their states
        listElement.querySelectorAll('.tab-select').forEach(function(checkbox) {
            const tabId = checkbox.closest('.session').querySelector('.tab-id').textContent;
            checkboxStates[tabId] = checkbox.checked;
        });
    }

    function continouslyUpdate() {
        updateTabList();
        setTimeout(continouslyUpdate, 1000);
    }
     
    continouslyUpdate();

    chrome.tabs.onUpdated.addListener(updateTabList);
    chrome.tabs.onRemoved.addListener(updateTabList);
    chrome.tabs.onActivated.addListener(updateTabList);

    chrome.tabs.onActivated.addListener(function(activeInfo) {
        const tabId = activeInfo.tabId;
        lastActiveTimes[tabId] = new Date();
    });

    document.getElementById('selectAllInactive').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.session');
        checkboxes.forEach(function(box) {
            if (box.style.backgroundColor === 'lightcoral') {
                box.querySelector('.tab-select').checked = true;
            }
        });
    });

    document.getElementById('deleteSelected').addEventListener('click', function() {
        const selectedTabs = document.querySelectorAll('.session .tab-select:checked');
        selectedTabs.forEach(function(box) {
            const sessionElement = box.closest('.session');
            const tabID = sessionElement.querySelector('.tab-id').textContent;
            sessionElement.parentNode.removeChild(sessionElement);
            chrome.tabs.remove(parseInt(tabID));
        });
    });


    // Function to save data to localStorage
    function saveDataToStorage() {
        localStorage.setItem(timeThresholdKey, document.getElementById('thresholdInput').value);
        localStorage.setItem(timeUnitKey, document.getElementById('timeInput').value);
    }

    // Function to load data from localStorage
    function loadDataFromStorage() {
        const storedThreshold = localStorage.getItem(timeThresholdKey);
        const storedUnit = localStorage.getItem(timeUnitKey);

        if (storedThreshold && storedUnit) {
            document.getElementById('thresholdInput').value = storedThreshold;
            document.getElementById('timeInput').value = storedUnit;
        }
    }

    // Function to convert time to milliseconds
    function convertToMilliseconds(time, unit) {
        switch(unit) {
            case 'second':
                return time * 1000;
            case 'minute':
                return time * 60 * 1000;
            case 'hour':
                return time * 60 * 60 * 1000;
            case 'day':
                return time * 24 * 60 * 60 * 1000;
            default:
                return NaN; // Invalid unit
        }
    }

    // Function to handle threshold calculation
    function calculateThreshold() {
        // Get input values
        const thresholdInput = document.getElementById('thresholdInput');
        const timeInput = document.getElementById('timeInput');

        // Parse input values
        const threshold = parseFloat(thresholdInput.value);
        const unit = timeInput.value;

        // Convert threshold to milliseconds
        const thresholdInMilliseconds = convertToMilliseconds(threshold, unit);

        saveDataToStorage();
        // Output the result
        return thresholdInMilliseconds;
    }

    // Event listener for threshold calculation
    document.getElementById('thresholdInput').addEventListener('input', calculateThreshold);
    document.getElementById('timeInput').addEventListener('change', calculateThreshold);

    loadDataFromStorage();
   
});
