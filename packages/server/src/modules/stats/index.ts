import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { IResponseStats } from "@shared/types";
import { ResponseStats } from "@models/stats/response";
import { IRequest } from "src/custom_typings/request";
import { IRequestStats } from "@shared/types/request-stats";
import { MaterializedStats } from "@models/stats/materialized-stats";
import { TimeUnit, EventType, Aggregation } from "@shared/types/stats";
import { StatsAggregator } from "@models/stats/stats-aggregator";

export default Router()
  .post(
    "/",
    asyncRouteHandler<IResponseStats>(async (request: IRequest<unknown, IRequestStats>) => {
      const resp = new ResponseStats(request.body);

      await resp.prepare(request);

      return resp;
    })
  )
  .post(
    "/materialized",
    asyncRouteHandler<IResponseStats>(async (request: IRequest<unknown, IRequestStats>) => {
      const { fromDate, toDate, timeUnit, eventType, aggregateBy, filter } = request.body;

      // Check if we can use materialized data (only for "all" filters)
      const canUseMaterialized = 
        filter.userIds === "all" &&
        filter.entityTypes === "all" &&
        filter.relationTypes === "all" &&
        filter.editActivities.entities === true &&
        filter.editActivities.relationsMeta === true &&
        filter.editActivities.relationsStatement === true &&
        filter.editActivities.propsMeta === true &&
        filter.editActivities.propsStatement === true &&
        filter.editActivities.references === true &&
        filter.editActivities.tags === true;

      if (!canUseMaterialized) {
        // Fall back to original endpoint for specific filters
        const resp = new ResponseStats(request.body);
        await resp.prepare(request);
        return resp;
      }

      // Use materialized data
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);
      
      const materializedData = await MaterializedStats.findByDateRange(
        request.db.connection,
        timeUnit,
        fromDateObj,
        toDateObj,
        eventType,
        aggregateBy
      );

      // Transform materialized data to match IResponseStats format
      const values: Record<string, Record<string, number>> = {};
      
      for (const item of materializedData) {
        if (!values[item.date]) {
          values[item.date] = {};
        }
        values[item.date][item.aggregationKey] = item.count;
      }

      const response: IResponseStats = {
        fromDate,
        toDate,
        timeUnit,
        aggregateBy,
        eventType,
        values
      };

      return response;
    })
  )
  /**
   * Manual aggregation endpoint for triggering stats aggregation for specific date ranges
   * Useful for backfilling data or testing the aggregation process
   * 
   * @param fromDate - Start date timestamp (required)
   * @param toDate - End date timestamp (required) 
   * @param timeUnits - Array of time units to aggregate (optional, defaults to all)
   * @param aggregateBy - Array of aggregation types (optional, defaults to all)
   * @returns Object with success message and number of records processed
   */
  .post(
    "/aggregate",
    asyncRouteHandler<{ message: string; recordsProcessed: number }>(async (request: IRequest<unknown, { fromDate: number; toDate: number; timeUnits?: TimeUnit[]; aggregateBy?: Aggregation[] }>) => {
      const { fromDate, toDate, timeUnits, aggregateBy } = request.body;

      if (fromDate === undefined || fromDate === null || toDate === undefined || toDate === null) {
        throw new Error("fromDate and toDate are required");
      }

      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);

      if (fromDateObj >= toDateObj) {
        throw new Error("fromDate must be before toDate");
      }

      // Default to all time units and aggregation types if not specified
      const targetTimeUnits = timeUnits || [TimeUnit.DAY, TimeUnit.WEEK, TimeUnit.MONTH, TimeUnit.YEAR];
      const targetAggregateBy = aggregateBy || [Aggregation.USER, Aggregation.ACTIVITY_TYPE];
      const eventTypes = Object.values(EventType);

      const aggregator = new StatsAggregator(request.db.connection);
      let totalRecordsProcessed = 0;

      console.log(`Starting manual aggregation from ${fromDateObj.toISOString()} to ${toDateObj.toISOString()}`);

      // Aggregate for each combination of time unit and aggregateBy
      for (const timeUnit of targetTimeUnits) {
        for (const aggBy of targetAggregateBy) {
          try {
            console.log(`Aggregating ${timeUnit} data with ${aggBy} aggregation...`);
            
            const stats = await aggregator.aggregateForDateRange(
              fromDateObj,
              toDateObj,
              timeUnit,
              eventTypes,
              aggBy
            );

            if (stats.length > 0) {
              await MaterializedStats.bulkInsert(request.db.connection, timeUnit, stats);
              totalRecordsProcessed += stats.length;
              console.log(`Inserted ${stats.length} ${timeUnit} stats records for ${aggBy}`);
            }
          } catch (error) {
            console.error(`Error aggregating ${timeUnit} data for ${aggBy}:`, error);
            throw error;
          }
        }
      }

      const message = `Successfully aggregated stats data from ${fromDateObj.toISOString()} to ${toDateObj.toISOString()}. Processed ${totalRecordsProcessed} records across ${targetTimeUnits.length} time units and ${targetAggregateBy.length} aggregation types.`;

      console.log(message);

      return {
        message,
        recordsProcessed: totalRecordsProcessed
      };
    })
  );
