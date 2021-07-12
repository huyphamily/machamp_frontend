import { Line } from 'react-chartjs-2';
import React from 'react';
import { Heading } from "@airtable/blocks/ui";
import { Box } from "@airtable/blocks/ui";
import { defaults } from 'react-chartjs-2';

// Disable animating charts by default.
defaults.animation = false;


const LineChart = ({ title, dataArray, labels, label, options }) => {
    const data = {
        labels,
        datasets: [{
            label,
            data: dataArray,
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
        }],
    };

    return <Box padding={2}>
      <Heading>{title}</Heading>
      <Line data={data} options={options} />
    </Box>
};
  
  export default LineChart;
