import { Line } from 'react-chartjs-2';
import React from 'react';
import { Heading } from "@airtable/blocks/ui";

const LineChart = ({ title, data, options }) => {
    console.log(title, options);
    return <>
      <Heading>{title}</Heading>
      <Line data={data} options={options} />
    </>
};
  
  export default LineChart;
