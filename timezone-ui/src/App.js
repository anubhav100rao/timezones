import React, { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:8000"; // update if necessary

export default function App() {
	const [availableTimeZones, setAvailableTimeZones] = useState([]);
	const [selectedTimeZone, setSelectedTimeZone] = useState("Asia/Kolkata");
	const [currentTime, setCurrentTime] = useState("current time loading...");
	const [searchQuery, setSearchQuery] = useState("");
	const [conversionResult, setConversionResult] = useState(null);

	// For time conversion form
	const [sourceTimezone, setSourceTimezone] = useState("America/New_York");
	const [targetTimezone, setTargetTimezone] = useState("Asia/Kolkata");
	// Default to current time in ISO format without seconds for input[type="datetime-local"]
	const initialTime = new Date().toISOString().slice(0, 16);
	const [timeToConvert, setTimeToConvert] = useState(initialTime);

	// Fetch available time zones from the backend
	useEffect(() => {
		fetch(`${API_URL}/timezones`)
			.then((res) => res.json())
			.then((data) => {
				setAvailableTimeZones(data.timezones);
			})
			.catch((err) => console.error("Error fetching timezones:", err));
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			fetch(`${API_URL}/timezones`)
				.then((res) => res.json())
				.then((data) => {
					setAvailableTimeZones(data.timezones);
				})
				.catch((err) =>
					console.error("Error fetching timezones:", err)
				);
		}, 5000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		fetch(`${API_URL}/current_time`)
			.then((res) => res.json())
			.then((data) => {
				setCurrentTime(data.current_time);
				setSelectedTimeZone(data.timezone);
			})
			.catch((err) => console.error("Error fetching current time:", err));
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			fetch(`${API_URL}/current_time`)
				.then((res) => res.json())
				.then((data) => {
					setCurrentTime(data.current_time);
					setSelectedTimeZone(data.timezone);
				})
				.catch((err) =>
					console.error("Error fetching current time	:", err)
				);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	function parseTimezone(time) {
		if (!time) return "";
		// time: "2025-03-08T05:08:43.620624-05:00"
		return time;
	}

	// Filter the time zones based on the search query
	const filteredTimeZones = availableTimeZones.filter((item) =>
		item.timezone.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Function to convert time using the backend endpoint
	const handleConvertTime = async () => {
		const payload = {
			source_timezone: sourceTimezone,
			target_timezone: targetTimezone,
			time: timeToConvert,
		};

		try {
			let response = await fetch(`${API_URL}/convert-time`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			response = await response.json();
			setConversionResult(response);
		} catch (err) {
			console.error("Error converting time:", err);
		}
	};

	return (
		<div className="app-container">
			<h1 className="title">Timezone App</h1>

			<div className="info">
				<span>Your current time and timezone are:</span>
				<h2 className="time">{parseTimezone(currentTime)}</h2>
				<h2 className="timezone">{selectedTimeZone}</h2>
			</div>

			<div className="search-container">
				<input
					type="text"
					placeholder="Search time zones..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="search-input"
				/>
			</div>

			<h2 className="subtitle">Available Time Zones</h2>
			<ul className="timezone-list">
				{filteredTimeZones.map((item) => (
					<li key={item.timezone} className="timezone-item">
						<strong>{item.timezone}</strong> — {item.current_time}
					</li>
				))}
				{filteredTimeZones.length === 0 && (
					<li className="timezone-item no-results">
						No time zones found
					</li>
				)}
			</ul>

			<div className="conversion-container">
				<h2>Convert Time</h2>
				<div className="form-group">
					<label>Source Timezone: </label>
					<select
						value={sourceTimezone}
						onChange={(e) => setSourceTimezone(e.target.value)}
					>
						{availableTimeZones.map((item) => (
							<option key={item.timezone} value={item.timezone}>
								{item.timezone}
							</option>
						))}
					</select>
				</div>
				<div className="form-group">
					<label>Target Timezone: </label>
					<select
						value={targetTimezone}
						onChange={(e) => setTargetTimezone(e.target.value)}
					>
						{availableTimeZones.map((item) => (
							<option key={item.timezone} value={item.timezone}>
								{item.timezone}
							</option>
						))}
					</select>
				</div>
				<div className="form-group">
					<label>Time (ISO Format): </label>
					<input
						type="datetime-local"
						value={timeToConvert}
						onChange={(e) => setTimeToConvert(e.target.value)}
					/>
				</div>
				<button onClick={handleConvertTime} className="convert-btn">
					Convert Time
				</button>

				{conversionResult && (
					<div className="conversion-result">
						<h3>Conversion Result:</h3>
						<p>
							<strong>Source:</strong>{" "}
							{conversionResult.source_time} (
							{conversionResult.source_timezone})
						</p>
						<p>
							<strong>Target:</strong>{" "}
							{conversionResult.target_time} (
							{conversionResult.target_timezone})
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
