import { Line } from 'react-chartjs-2';
import React from 'react';
import { Heading } from "@airtable/blocks/ui";
import { Box } from "@airtable/blocks/ui";

const LineChart = ({ title, data, options }) => {
    return <Box padding={2}>
      <Heading>{title}</Heading>
      <Line data={data} options={options} />
    </Box>
};
  
  export default LineChart;
