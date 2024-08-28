import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import sendJsonData from '../apiService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SiteStats = ({ setOutputData }) => {  // Accept setOutputData as a prop
  const [stats, setStats] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [disableInteractions, setDisableInteractions] = useState(false);
  const [activeTab, setActiveTab] = useState('bar');
  const [selectedDate, setSelectedDate] = useState(new Date('2024-04-14')); // State for selected date
  const [errorMessage, setErrorMessage] = useState('');  // State for error message

  useEffect(() => {
    fetch("/CORS_Site_JSON_1.json")
      .then(response => response.json())
      .then(data => {
        const statusCounts = data.features.reduce((acc, feature) => {
          const status = feature.properties.STATUS;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        setStats(statusCounts);
      });
  }, []);

  const data = {
    labels: Object.keys(stats),
    datasets: [
      {
        label: "Site Status",
        data: Object.values(stats),
        backgroundColor: ["blue", "red", "yellow", "orange"],
      },
    ],
  };

  const openModal = () => {
    setModalIsOpen(true);
    setDisableInteractions(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setDisableInteractions(false);
    setErrorMessage('');
  };

  const datefun = (date) => {
    sendJsonData(date)
      .then(response => {
        setOutputData(response.data);  // This will trigger the useEffect in the parent component to log the new data
      })
      .catch(error => {
        console.error("There was an error!", error);
        setErrorMessage('Please choose a date between 14 April 2024 to 31 May 2024');
        setModalIsOpen(true);  // Show the modal with the error message
      });
  };

  return (
    <div className={`site-stats ${disableInteractions ? 'pointer-events-none select-none' : ''}`}>
      <h1>Additional Info</h1>
      {/* <h2>Site Statistics</h2> */}
      
      {/* <button onClick={openModal} className="px-5 py-2.5 mt-3 text-base rounded-lg border-none cursor-pointer text-white bg-blue-500">Show Graph</button> */}
      
      {/* Date Picker */}
      <div className="row mt-3">
        <div className="col-sm-6 col-lg-5 mb-3 mb-sm-0">
          <label className="block text-gray-700 text-sm font-bold mb-2">Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={date => {
              setSelectedDate(date); // Update the selected date state
              datefun(date); // Call the datefun function
            }}
            className="block w-full p-2 border rounded"
            dateFormat="yyyy/MM/dd"
          />
        </div>
      </div>
      
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/5 max-w-2xl p-5 bg-white"
        overlayClassName="bg-[rgba(0,0,0,0.75)]"
        contentLabel={errorMessage ? "Error" : "Site Statistics"}
      >
        <button className="bg-red-500 text-white absolute top-2.5 right-3 p-2 text-base border-none cursor-pointer rounded-lg" onClick={closeModal}>X</button>
        
        {errorMessage ? (
          <div>
            <h2>Error</h2>
            <p>{errorMessage}</p>
          </div>
        ) : (
          <div>
            <h2>Site Statistics</h2>

            {/* Tab navigation */}
            <div className="flex justify-center mb-5">
              <button
                className={`px-5 py-2.5 text-base cursor-pointer border-none bg-gray-200 mx-2 ${activeTab === 'bar' ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setActiveTab('bar')}
              >
                Bar Graph
              </button>
              <button
                className={`px-5 py-2.5 text-base cursor-pointer border-none bg-gray-200 mx-2 ${activeTab === 'pie' ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setActiveTab('pie')}
              >
                Pie Chart
              </button>
            </div>

            {/* Render Bar or Pie chart based on activeTab */}
            {activeTab === 'bar' && <Bar data={data} />}
            {activeTab === 'pie' && (
              <div className="flex justify-center items-center h-72 w-72 mx-auto">
                <Pie data={data} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SiteStats;
