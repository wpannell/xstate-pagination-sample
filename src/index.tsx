import "./styles.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { useMachine, useInterpret, useService } from "@xstate/react";
import simpleDataFetchMachine, {
  SimpleDataFetchMachineEvent
} from "./dataFetch.machine";
import paginationMachine, {
  PaginationMachineEvent
} from "./pagination.machine";
import { EventObject, Interpreter } from "xstate";

function useCombineServices<TEvent extends EventObject>(
  useFunc: (
    send: (event: TEvent) => void
  ) => { [id: string]: Interpreter<any, any, any> }
) {
  let serviceMap = {};

  const send = React.useCallback(
    (event: TEvent) => {
      Object.keys(serviceMap).forEach((key) => {
        serviceMap[key].send(event);
      });
    },
    [serviceMap]
  );

  const services = useFunc(send);

  serviceMap = services;

  return { services, send };
}

function App() {
  const { services, send } = useCombineServices<
    PaginationMachineEvent | SimpleDataFetchMachineEvent
  >((send) => {
    const dataFetchService = useInterpret(simpleDataFetchMachine, {
      actions: {
        updatePaginationTotalPages: (context, event) => {
          if (event.type !== "RECEIVE_DATA") return;

          send({
            type: "UPDATE_TOTAL_PAGES",
            totalPages: event.totalPages
          });
        }
      }
    });
    const paginationService = useInterpret(paginationMachine);

    return {
      dataFetch: dataFetchService,
      pagination: paginationService
    };
  });

  const [dataState] = useService(services.dataFetch);
  const [paginationState] = useService(services.pagination);

  React.useEffect(() => {
    send({
      type: "FETCH",
      variables: {
        page: paginationState.context.currentPage
      }
    });
  }, [paginationState.context.currentPage]);

  return (
    <div>
      <pre>
        {JSON.stringify(
          { value: dataState.value, context: dataState.context },
          null,
          2
        )}
      </pre>
      <pre>
        {JSON.stringify(
          {
            value: paginationState.value,
            context: paginationState.context
          },
          null,
          2
        )}
      </pre>
      <button onClick={() => send({ type: "NEXT_PAGE" })}>Next Page</button>
      <button onClick={() => send({ type: "PREV_PAGE" })}>Prev Page</button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
