document.getElementById('officerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    searchForOfficers(firstName, lastName);
});

function searchForOfficers(firstName, lastName) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Clear previous results

    let apiEndpoint = `https://data.cityofnewyork.us/resource/2fir-qns4.json`;

    fetch(apiEndpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let matchingOfficers = data.filter(officer => {
                return (firstName === '' || officer.officer_first_name.toLowerCase().includes(firstName.toLowerCase())) &&
                    (lastName === '' || officer.officer_last_name.toLowerCase().includes(lastName.toLowerCase()));
            });

            if (matchingOfficers.length > 0) {
                displayOfficerOptions(matchingOfficers);
            } else {
                resultsDiv.innerHTML = 'No officers found matching the criteria.';
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            resultsDiv.innerHTML = `An error occurred while fetching data: ${error.message}`;
        });
}

function displayOfficerOptions(officers) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Select an officer:</p>';

    officers.forEach(officer => {
        let button = document.createElement('button');
        button.className = 'officer-button';
        button.textContent = `${officer.officer_first_name} ${officer.officer_last_name}`;
        button.onclick = () => {
            displayOfficerInformation(officer);
            fetchAdditionalOfficerData(officer.officer_first_name, officer.officer_last_name);
        };
        resultsDiv.appendChild(button);
    });
}

function displayOfficerInformation(officer) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>${officer.officer_first_name} ${officer.officer_last_name}</h2>
        <p>Total Complaints: ${officer.total_complaints || 'N/A'}</p>
        <p>Total Substantiated Complaints: ${officer.total_substantiated_complaints || 'N/A'}</p>
    `;
}

function fetchAdditionalOfficerData(firstName, lastName) {
    // Encode first name and last name for the query
    const encodedFirstName = encodeURIComponent(firstName);
    const encodedLastName = encodeURIComponent(lastName);

    // Fetch the CSV file
    fetch('Citywide_Payroll_Data__Fiscal_Year_.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text(); // Read the CSV data as text
        })
        .then(csvData => {
            // Parse the CSV data using PapaParse
            Papa.parse(csvData, {
                header: true, // Treat the first row as headers
                dynamicTyping: true, // Automatically convert numbers
                complete: function(results) {
                    console.log("Parsed CSV Data:", results.data);
                    // Find and display the relevant data for the officer
                    let matchingRows = results.data.filter(item =>
                        item.first_name.trim().toUpperCase() === encodedFirstName.trim().toUpperCase() &&
                        item.last_name.trim().toUpperCase() === encodedLastName.trim().toUpperCase() &&
                        (item.agency_name === "Police Department" || item.agency_name === "POLICE DEPARTMENT")
                    );

                    if (matchingRows.length > 0) {
                        const officerData = matchingRows[0];
                        console.log("Filtered Data:", officerData);
                        displaySalaryInformation(officerData);
                    } else {
                        document.getElementById('results').innerHTML += '<p>No additional data found for the officer.</p>';
                    }
                },
                error: function(error) {
                    console.error('CSV Parsing Error:', error);
                    document.getElementById('results').innerHTML += `An error occurred while parsing the CSV data: ${error.message}`;
                }
            });
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            document.getElementById('results').innerHTML += `An error occurred while fetching the CSV data: ${error.message}`;
        });
}

function displaySalaryInformation(officerData) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML += `
        <h3>Salary and Hours Information:</h3>
        <p>Base Salary: ${officerData.base_salary}</p>
        <p>Regular Hours: ${officerData.regular_hours}</p>
        <p>Regular Gross Paid: ${officerData.regular_gross_paid}</p>
        <p>OT Hours: ${officerData.ot_hours}</p>
        <p>Total OT Paid: ${officerData.total_ot_paid}</p>
        <p>Total Other Pay: ${officerData.total_other_pay}</p>
    `;
}
