document.getElementById('officerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    searchForOfficers(firstName, lastName);
});

function searchForOfficers(firstName, lastName) {
    let resultsDiv = document.getElementById('results');
    let optionsDiv = document.getElementById('officerOptions');
    resultsDiv.innerHTML = ''; // Clear previous results
    optionsDiv.innerHTML = ''; // Also clear officer options

    let csvUrl = 'https://raw.githubusercontent.com/KrummenauerKael/OfficerInformationLookup/main/Civilian_Complaint_Review_Board__Police_Officers.csv';

    fetch(csvUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    let matchingRows = results.data.filter(item => {
                        let fName = item['Officer First Name']?.trim().toUpperCase();
                        let lName = item['Officer Last Name']?.trim().toUpperCase();
                        return (firstName === "" || fName === firstName.toUpperCase()) &&
                               (lastName === "" || lName === lastName.toUpperCase());
                    });

                    if (matchingRows.length > 0) {
                        displayOfficerOptions(matchingRows);
                    } else {
                        resultsDiv.innerHTML = `<p>No officers found matching the search criteria.</p>`;
                    }
                },
                error: function(error) {
                    console.error('CSV Parsing Error:', error);
                    resultsDiv.innerHTML = `An error occurred while parsing the CSV data: ${error.message}`;
                }
            });
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            resultsDiv.innerHTML = `An error occurred while fetching the CSV data: ${error.message}`;
        });
}

function displayOfficerOptions(officers) {
    let optionsDiv = document.getElementById('officerOptions');
    optionsDiv.innerHTML = '<p>Select an officer:</p>';

    officers.forEach(officer => {
        let button = document.createElement('button');
        button.className = 'officer-button';
        button.textContent = `${officer['Officer First Name']} ${officer['Officer Last Name']}`;
        button.onclick = () => {
            optionsDiv.innerHTML = ''; // Clear the officer options when one is selected
            displayOfficerInformation(officer);
        };
        optionsDiv.appendChild(button);
    });
}

function displayOfficerInformation(officer) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>${officer['Officer First Name'] || 'N/A'} ${officer['Officer Last Name'] || 'N/A'}</h2>
        <p>Current Rank: ${officer['Current Rank'] || 'N/A'}</p>
        <p>Identifier (Tax ID): ${officer['Tax ID'] || 'N/A'}</p>
        <p>(The identifier is similar to a badge number and is unique to each officer.)</p>
        <p>Total Complaints: ${officer['Total Complaints'] || 'N/A'}</p>
        <p>Total Substantiated Complaints: ${officer['Total Substantiated Complaints'] || 'N/A'}</p>
        <p>You can also use the information provided to search directly in the NYPD database, including individual complaints and if disciplinary measures were taken.</p>
        <p>Simply input the information here: https://www.nyc.gov/site/ccrb/policy/MOS-records.page </p>
    `;

    fetchAdditionalOfficerData(officer['Officer First Name'], officer['Officer Last Name']);
}

function fetchAdditionalOfficerData(firstName, lastName) {
    const encodedFirstName = encodeURIComponent(firstName);
    const encodedLastName = encodeURIComponent(lastName);

    let csvUrl = 'https://raw.githubusercontent.com/KrummenauerKael/OfficerInformationLookup/main/Citywide_Payroll_Data__Fiscal_Year_.csv';

    fetch(csvUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    let matchingRows = results.data.filter(item =>
                        item['First Name']?.trim().toUpperCase() === encodedFirstName.toUpperCase() &&
                        item['Last Name']?.trim().toUpperCase() === encodedLastName.toUpperCase()
                    );

                    if (matchingRows.length > 0) {
                        displaySalaryInformation(matchingRows[0]);
                    } else {
                        displaySalaryInformation({});
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

    let regularGrossPaid = officerData['Regular Gross Paid'] || 0;
    let totalOTPaid = officerData['Total OT Paid'] || 0;
    let totalOtherPay = officerData['Total Other Pay'] || 0;

    let totalCompensation = regularGrossPaid + totalOTPaid + totalOtherPay;

    resultsDiv.innerHTML += `
        <h3>Salary and Hours Information:</h3>
        <p>Base Salary: ${officerData['Base Salary'] || 'N/A'}</p>
        <p>Regular Hours: ${officerData['Regular Hours'] || 'N/A'}</p>
        <p>Regular Gross Paid: ${regularGrossPaid}</p>
        <p>OT Hours: ${officerData['OT Hours'] || 'N/A'}</p>
        <p>Total OT Paid: ${totalOTPaid}</p>
        <p>Total Other Pay: ${totalOtherPay}</p>
        <p>Total Compensation: ${totalCompensation}</p>
    `;
}
