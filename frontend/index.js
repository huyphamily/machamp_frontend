import { initializeBlock, useBase } from '@airtable/blocks/ui';
import React, { useState }  from 'react';
import { Box, Button, FormField, Input } from "@airtable/blocks/ui";

function MachampApp() {
    const base = useBase();
    const stockTable = base.getTable('Stock');
    const queueTable = base.getTable('R40Queue');
    const [ticker, setTicker] = useState("");

    const onSubmit = async (event) => {
        event.preventDefault();
        const queryResult = stockTable.selectRecords();
        const upperCaseTicker = ticker.toUpperCase();

        await queryResult.loadDataAsync();

        const tickerRecord = queryResult.records.find((record) => {
            return record.getCellValue(stockTable.primaryField) === upperCaseTicker
        });
        let tickerRecordId = tickerRecord && tickerRecord.id;

        if (!tickerRecordId) {
            const companies = await fetch(`https://financialmodelingprep.com/api/v3/profile/${upperCaseTicker}?apikey=7d86e4fdf1d1e51adcbfad58c7e45d15`)
                .then(response => response.json());
            const companyName = companies.length && companies[0].companyName;
            
            if (!companyName) {
                throw('Stock Symbol does not exists');
            }

            tickerRecordId = await stockTable.createRecordAsync({
                Symbol: upperCaseTicker,
                Name: companyName,
            });
        }

        queueTable.createRecordAsync({
            'Stock': [{id: tickerRecordId}],
        });
    };

    return <Box padding={2}>
        <form onSubmit={(e) => onSubmit(e)}>
            <FormField label="Symbol">
                <Input
                    value={ticker}
                    onChange={e => setTicker(e.target.value)}
                    placeholder="AAPL"
                />
            </FormField>
            <Button type="submit">Search</Button>
        </form>
    </Box>;
}

initializeBlock(() => <MachampApp />);
